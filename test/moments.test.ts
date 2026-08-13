import { describe, expect, it } from "vitest";
import { snapCandidateToTranscript } from "@/lib/pipeline/moments";

describe("snapCandidateToTranscript", () => {
  it("snaps model boundaries to deterministic transcript sentence boundaries", () => {
    const snapped = snapCandidateToTranscript(
      "project-1",
      { startSeconds: 9.6, endSeconds: 20.4, score: 8, rationale: "Complete idea", tag: "insight" },
      [
        { id: "a", projectId: "project-1", startSeconds: 0, endSeconds: 9, text: "Setup." },
        { id: "b", projectId: "project-1", startSeconds: 10, endSeconds: 20, text: "The moment." },
        { id: "c", projectId: "project-1", startSeconds: 21, endSeconds: 30, text: "Follow-up." },
      ],
    );

    expect(snapped.startSeconds).toBe(10);
    expect(snapped.endSeconds).toBe(20);
  });
});
