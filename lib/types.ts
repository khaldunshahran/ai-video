export type ProjectStatus = "pending" | "processing" | "ready" | "failed";
export type JobType = "ingest" | "transcribe_chunk" | "analyze";
export type JobStatus = "queued" | "running" | "done" | "failed";
export type MomentDecision = "used" | "not_useful";

export interface TranscriptSegment {
  id: string;
  projectId: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel?: string;
  text: string;
}

export interface CandidateMoment {
  id: string;
  projectId: string;
  startSeconds: number;
  endSeconds: number;
  score: number;
  rationale: string;
  tag: string;
}
