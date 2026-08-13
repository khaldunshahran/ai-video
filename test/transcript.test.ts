import { describe, expect, it } from "vitest";
import { mergeTranscriptChunks } from "@/lib/pipeline/transcript";

const projectId = "project-1";

describe("mergeTranscriptChunks", () => {
  it("converts chunk-local timestamps into canonical episode-relative timestamps", () => {
    const merged = mergeTranscriptChunks([
      { projectId, chunkIndex: 1, offsetSeconds: 1880, segments: [{ startSeconds: 2.5, endSeconds: 4, text: "late segment" }] },
      { projectId, chunkIndex: 0, offsetSeconds: 0, segments: [{ startSeconds: 8, endSeconds: 11, text: "early segment" }] },
    ]);

    expect(merged).toEqual([
      expect.objectContaining({ startSeconds: 8, endSeconds: 11, text: "early segment" }),
      expect.objectContaining({ startSeconds: 1882.5, endSeconds: 1884, text: "late segment" }),
    ]);
  });
});
