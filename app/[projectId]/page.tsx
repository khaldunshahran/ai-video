"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/db/client";
import { formatTimestamp } from "@/lib/time";
import { useParams } from "next/navigation";
import { saveDecision } from "../actions";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: p }, { data: j }, { data: c }, { data: t }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("jobs").select("*").eq("project_id", projectId).order("id", { ascending: true }),
        supabase.from("candidate_moments").select("*").eq("project_id", projectId).order("start_seconds", { ascending: true }),
        supabase.from("transcript_segments").select("*").eq("project_id", projectId).order("start_seconds", { ascending: true })
      ]);
      setProject(p);
      setJobs(j || []);
      setCandidates(c || []);
      setTranscript(t || []);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleJump = (seconds: number) => {
    setCurrentTime(seconds);
    // Scroll transcript to this time roughly
    const element = document.getElementById(`segment-${seconds}`);
    if (element && transcriptRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleDecision = async (id: string, decision: "used" | "not_useful", start: number, end: number) => {
    try {
      await saveDecision(id, decision, start, end);
      alert("Decision saved!");
    } catch (err) {
      alert("Error saving decision: " + String(err));
    }
  };

  if (!project) return <div className="shell">Loading...</div>;

  // Extract YT video ID (simple logic for prototype)
  let videoId = "";
  try {
    const url = new URL(project.source_url);
    videoId = url.searchParams.get("v") || url.pathname.slice(1) || "";
  } catch(e) {}

  return (
    <main className="shell">
      <section className="hero" style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Project Status: {project.status}</div>
          <h1>{project.title || "Processing audio..."}</h1>
          <p>
            Jobs: {jobs.map(j => `${j.type} (${j.status})`).join(" | ")}
          </p>
        </div>
        {videoId && (
          <div style={{ flex: 1 }}>
            <iframe
              width="100%"
              height="250"
              src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(currentTime)}&autoplay=${currentTime > 0 ? 1 : 0}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </section>

      <section className="grid" aria-label="Podcast review workspace">
        <div className="panel">
          <h2>Ranked candidates</h2>
          {candidates.length === 0 && <p>No candidates yet. Waiting for analysis...</p>}
          {candidates.map((moment) => (
            <article className="moment" key={moment.id} style={{ cursor: "pointer" }} onClick={() => handleJump(moment.start_seconds)}>
              <div className="meta">{formatTimestamp(moment.start_seconds)}–{formatTimestamp(moment.end_seconds)} · Score {moment.score}/10 · {moment.tag}</div>
              <strong>{moment.rationale}</strong>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={(e) => { e.stopPropagation(); handleDecision(moment.id, "used", moment.start_seconds, moment.end_seconds); }}>Accept</button>
                <button onClick={(e) => { e.stopPropagation(); handleDecision(moment.id, "not_useful", moment.start_seconds, moment.end_seconds); }}>Reject</button>
              </div>
            </article>
          ))}
        </div>
        <div className="panel transcript" ref={transcriptRef} style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h2>Merged transcript</h2>
          {transcript.length === 0 && <p>No transcript yet. Waiting for processing...</p>}
          {transcript.map((segment) => (
            <div className="segment" key={segment.id} id={`segment-${segment.start_seconds}`}>
              <code>{formatTimestamp(segment.start_seconds)}</code>
              <span>{segment.text}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
