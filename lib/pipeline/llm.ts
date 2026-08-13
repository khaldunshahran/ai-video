import OpenAI from "openai";
import type { TranscriptSegment } from "@/lib/types";
import { type RawCandidateMoment } from "./moments";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
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

Return your response strictly as a JSON object containing a "moments" array. Do not wrap it in markdown blockquotes or add any other text.
Each object in the array must have:
- "startSeconds": number (the exact start time in seconds from the transcript)
- "endSeconds": number (the exact end time in seconds)
- "score": number (1-10)
- "rationale": string (1 sentence explaining why this is a good clip)
- "tag": string (e.g., "insight", "story", "funny")
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" } // to use json_object we actually need the prompt to ask for an object. Let's ask for an object containing a 'moments' array.
  });

  const textOutput = response.choices[0].message.content || "";
  
  try {
    const parsed = JSON.parse(textOutput);
    // if we use json_object, we need to handle if it wraps in { moments: [] }
    return Array.isArray(parsed) ? parsed : (parsed.moments || parsed.candidate_moments || []);
  } catch (err) {
    console.error("Failed to parse GPT output:", textOutput);
    return [];
  }
}
