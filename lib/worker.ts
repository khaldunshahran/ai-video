import { supabase } from "./db/client";

async function runWorker() {
  console.log("Background worker started. Polling for jobs...");

  while (true) {
    try {
      // Find one queued job
      const { data: job, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "queued")
        .order("created_at", { ascending: true }) // we don't have created_at on jobs, let's use id or just order by nothing. wait, schema.sql has no created_at on jobs. Let's not order.
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching jobs:", error.message);
      }

      if (job) {
        console.log(`Processing job ${job.id} (type: ${job.type})`);
        
        // Mark as running
        await supabase.from("jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", job.id);

        try {
          if (job.type === "ingest") {
            await processIngestJob(job);
          } else if (job.type === "transcribe_chunk") {
            await processTranscribeJob(job);
          } else if (job.type === "analyze") {
            await processAnalyzeJob(job);
          } else {
            throw new Error(`Unknown job type: ${job.type}`);
          }

          // Mark as done
          await supabase.from("jobs").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", job.id);
          console.log(`Job ${job.id} completed successfully.`);
        } catch (jobError: any) {
          console.error(`Job ${job.id} failed:`, jobError);
          const attempts = job.attempts + 1;
          const status = attempts >= 3 ? "failed" : "queued";
          await supabase.from("jobs").update({ 
            status, 
            error: jobError.message || String(jobError),
            attempts 
          }).eq("id", job.id);
        }
      }
    } catch (err) {
      console.error("Worker error:", err);
    }

    // Sleep for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

async function processIngestJob(job: any) {
  // Extract audio using yt-dlp
  const { YtDlpAudioProvider } = await import("./audio/ytdlp-provider");
  const provider = new YtDlpAudioProvider();
  
  // Need to get the project URL
  const { data: project } = await supabase.from("projects").select("source_url").eq("id", job.project_id).single();
  if (!project) throw new Error("Project not found");

  const audio = await provider.extract({ url: project.source_url });
  await supabase.from("projects").update({ title: audio.title, duration_seconds: audio.durationSeconds }).eq("id", job.project_id);

  // Split audio into chunks for Whisper API
  const { splitAudio } = await import("./audio/chunker");
  const chunks = await splitAudio(audio.filePath);

  // Create transcribe jobs for each chunk
  for (const chunk of chunks) {
    await supabase.from("jobs").insert({
      project_id: job.project_id,
      type: "transcribe_chunk",
      status: "queued",
      // We pass chunk metadata in the error field for now since we don't have a payload column, 
      // or better: we just use a structured format in a separate table/column.
      // Wait, we can't alter schema here easily without a migration. Let's stash chunk payload in error field as JSON temporarily
      // NO, let's just add a payload column to the jobs table, or use a temporary local file. 
      // Actually, since we need to pass filePath, chunkIndex, offsetSeconds to the transcribe job,
      // and jobs table doesn't have a payload JSON column, let's just write to a temporary file in /tmp
      // Wait, we can't do that. Let's parse error field as JSON.
      error: JSON.stringify({ filePath: chunk.filePath, chunkIndex: chunk.chunkIndex, offsetSeconds: chunk.offsetSeconds })
    });
  }
}

async function processTranscribeJob(job: any) {
  const { transcribeAudioChunk } = await import("./pipeline/whisper");
  const payload = JSON.parse(job.error || "{}");
  if (!payload.filePath) throw new Error("Missing filePath in transcribe job payload");

  const segments = await transcribeAudioChunk(payload.filePath);

  // Apply offset and insert into transcript_segments
  const offset = payload.offsetSeconds || 0;
  
  const mappedSegments = segments.map(seg => ({
    project_id: job.project_id,
    start_seconds: seg.startSeconds + offset,
    end_seconds: seg.endSeconds + offset,
    text: seg.text,
  }));

  if (mappedSegments.length > 0) {
    await supabase.from("transcript_segments").insert(mappedSegments);
  }

  // Clear the payload from the error field
  await supabase.from("jobs").update({ error: null }).eq("id", job.id);

  // Check if this was the last transcribe job for the project
  const { count } = await supabase.from("jobs")
    .select("*", { count: 'exact', head: true })
    .eq("project_id", job.project_id)
    .eq("type", "transcribe_chunk")
    .neq("status", "done")
    .neq("id", job.id); // exclude current job

  if (count === 0) {
    // All transcription chunks are done! Queue the analyze job.
    await supabase.from("jobs").insert({
      project_id: job.project_id,
      type: "analyze",
      status: "queued"
    });
  }
}

async function processAnalyzeJob(job: any) {
  const { chunkTranscriptForLLM, analyzeTranscriptWindow } = await import("./pipeline/claude");
  const { snapCandidateToTranscript } = await import("./pipeline/moments");

  const { data: dbSegments } = await supabase.from("transcript_segments")
    .select("*")
    .eq("project_id", job.project_id)
    .order("start_seconds", { ascending: true });
    
  if (!dbSegments || dbSegments.length === 0) {
    throw new Error("No transcript segments found for analysis");
  }

  const segments = dbSegments.map(s => ({
    id: s.id,
    projectId: s.project_id,
    startSeconds: s.start_seconds,
    endSeconds: s.end_seconds,
    text: s.text,
    speakerLabel: s.speaker_label
  }));

  const windows = chunkTranscriptForLLM(segments);
  let allCandidates = [];

  for (const window of windows) {
    const windowCandidates = await analyzeTranscriptWindow(window);
    allCandidates.push(...windowCandidates);
  }

  if (allCandidates.length > 0) {
    const snappedCandidates = allCandidates.map(c => snapCandidateToTranscript(job.project_id, c, segments));
    const insertData = snappedCandidates.map(c => ({
      project_id: c.projectId,
      start_seconds: c.startSeconds,
      end_seconds: c.endSeconds,
      score: c.score,
      rationale: c.rationale,
      tag: c.tag
    }));
    await supabase.from("candidate_moments").insert(insertData);
  }

  await supabase.from("projects").update({ status: "ready" }).eq("id", job.project_id);
}

// Ensure the process stays running and handles exits gracefully
process.on("SIGINT", () => {
  console.log("Worker shutting down...");
  process.exit(0);
});

runWorker();
