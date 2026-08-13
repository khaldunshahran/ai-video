import { describe, expect, it } from "vitest";
import { chunkTranscriptForLLM } from "@/lib/pipeline/llm";
import type { TranscriptSegment } from "@/lib/types";

describe("chunkTranscriptForLLM", () => {
  it("chunks transcript into sliding windows", () => {
    const segments: TranscriptSegment[] = [
      { id: "1", projectId: "p1", startSeconds: 0, endSeconds: 300, text: "Seg 1" },
      { id: "2", projectId: "p1", startSeconds: 310, endSeconds: 610, text: "Seg 2" },
      { id: "3", projectId: "p1", startSeconds: 620, endSeconds: 900, text: "Seg 3" },
      { id: "4", projectId: "p1", startSeconds: 910, endSeconds: 1200, text: "Seg 4" },
    ];

    // Using 600s window, 60s overlap
    const windows = chunkTranscriptForLLM(segments, 600, 60);

    expect(windows.length).toBe(2);
    
    // Window 0: 0-600s
    expect(windows[0].text).toContain("Seg 1");
    expect(windows[0].text).toContain("Seg 2"); 
    expect(windows[0].text).not.toContain("Seg 3"); 
    
    // Window 1: 540-1140s
    expect(windows[1].text).not.toContain("Seg 1");
    expect(windows[1].text).toContain("Seg 3");
    expect(windows[1].text).toContain("Seg 4");
  });
});
