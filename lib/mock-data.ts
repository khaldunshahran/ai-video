import type { CandidateMoment, TranscriptSegment } from "./types";

export const mockTranscriptSegments: TranscriptSegment[] = [
  { id: "s1", projectId: "demo", startSeconds: 0, endSeconds: 12, text: "Welcome back. Today we are talking about the mistake that changed how we build products." },
  { id: "s2", projectId: "demo", startSeconds: 612, endSeconds: 628, text: "The insight was not that the model was smarter. It was that the workflow made reviewing faster." },
  { id: "s3", projectId: "demo", startSeconds: 1880, endSeconds: 1904, text: "If the tool misses the best moment, convenience does not matter. Miss rate is the metric that keeps us honest." },
];

export const mockCandidateMoments: CandidateMoment[] = [
  { id: "m1", projectId: "demo", startSeconds: 612, endSeconds: 628, score: 9.1, rationale: "Clear thesis with a strong hook about workflow speed.", tag: "product insight" },
  { id: "m2", projectId: "demo", startSeconds: 1880, endSeconds: 1904, score: 8.7, rationale: "Memorable checkpoint that defines the product's success metric.", tag: "evaluation" },
];
