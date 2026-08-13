import type { TranscriptSegment } from "@/lib/types";

export interface LocalTranscriptSegment {
  startSeconds: number;
  endSeconds: number;
  text: string;
  speakerLabel?: string;
}

export interface TranscribedChunk {
  projectId: string;
  chunkIndex: number;
  offsetSeconds: number;
  segments: LocalTranscriptSegment[];
}

export function mergeTranscriptChunks(chunks: TranscribedChunk[]): TranscriptSegment[] {
  return [...chunks]
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .flatMap((chunk) =>
      chunk.segments.map((segment, segmentIndex) => ({
        id: `${chunk.projectId}-${chunk.chunkIndex}-${segmentIndex}`,
        projectId: chunk.projectId,
        startSeconds: roundSeconds(segment.startSeconds + chunk.offsetSeconds),
        endSeconds: roundSeconds(segment.endSeconds + chunk.offsetSeconds),
        speakerLabel: segment.speakerLabel,
        text: segment.text,
      })),
    );
}

function roundSeconds(value: number): number {
  return Math.round(value * 1000) / 1000;
}
