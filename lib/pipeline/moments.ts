import type { CandidateMoment, TranscriptSegment } from "@/lib/types";

export interface RawCandidateMoment {
  startSeconds: number;
  endSeconds: number;
  score: number;
  rationale: string;
  tag: string;
}

export function snapCandidateToTranscript(projectId: string, raw: RawCandidateMoment, transcript: TranscriptSegment[]): CandidateMoment {
  const start = nearestBoundary(raw.startSeconds, transcript.map((segment) => segment.startSeconds));
  const end = nearestBoundary(raw.endSeconds, transcript.map((segment) => segment.endSeconds));
  return {
    id: `${projectId}-${start}-${end}-${raw.tag}`,
    projectId,
    startSeconds: Math.min(start, end),
    endSeconds: Math.max(start, end),
    score: raw.score,
    rationale: raw.rationale,
    tag: raw.tag,
  };
}

function nearestBoundary(target: number, boundaries: number[]): number {
  return boundaries.reduce((best, boundary) => (Math.abs(boundary - target) < Math.abs(best - target) ? boundary : best), boundaries[0] ?? target);
}
