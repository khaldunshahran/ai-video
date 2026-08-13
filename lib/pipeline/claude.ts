import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptSegment } from "@/lib/types";
import { type RawCandidateMoment } from "./moments";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TranscriptWindow {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export function chunkTranscriptForLLM(
  segments: TranscriptSegment[],
  windowDuration: number = 600, // 10 minutes
  overlapDuration: number = 60 // 1 minute overlap
): TranscriptWindow[] {
  const windows: TranscriptWindow[] = [];
  if (segments.length === 0) return windows;

  const totalDuration = segments[segments.length - 1].endSeconds;
  let currentStart = 0;

  while (currentStart < totalDuration) {
    const currentEnd = currentStart + windowDuration;
    const windowSegments = segments.filter(
      (s) => s.startSeconds >= currentStart && s.startSeconds < currentEnd
    );

    if (windowSegments.length > 0) {
      windows.push({
        startSeconds: windowSegments[0].startSeconds,
        endSeconds: windowSegments[windowSegments.length - 1].endSeconds,
        text: windowSegments.map(s => `[${formatTime(s.startSeconds)}] ${s.text}`).join("\n")
      });
    }

    currentStart += windowDuration - overlapDuration;
  }

  return windows;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function analyzeTranscriptWindow(window: TranscriptWindow): Promise<RawCandidateMoment[]> {
  const prompt = `You are an expert podcast editor. Analyze the following podcast transcript segment and identify the best candidate moments (clips) that would make great standalone highlights or shorts.

Criteria for a good moment:
- Has a strong hook or opening
- Contains a complete thought, story arc, or insight
- Resolves well (doesn't cut off awkwardly)

Transcript window:
${window.text}

Return your response strictly as a JSON array of objects. Do not wrap it in markdown blockquotes or add any other text.
Each object must have:
- "startSeconds": number (the exact start time in seconds from the transcript)
- "endSeconds": number (the exact end time in seconds)
- "score": number (1-10)
- "rationale": string (1 sentence explaining why this is a good clip)
- "tag": string (e.g., "insight", "story", "funny")
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textOutput = response.content[0].type === "text" ? response.content[0].text : "";
  
  try {
    // Attempt to parse JSON even if it's wrapped in markdown
    const jsonStr = textOutput.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as RawCandidateMoment[];
    return parsed;
  } catch (err) {
    console.error("Failed to parse Claude output:", textOutput);
    return [];
  }
}
