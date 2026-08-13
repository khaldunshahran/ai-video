import OpenAI from "openai";
import { createReadStream } from "node:fs";
import type { LocalTranscriptSegment } from "./transcript";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudioChunk(filePath: string): Promise<LocalTranscriptSegment[]> {
  const response = await openai.audio.transcriptions.create({
    file: createReadStream(filePath),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  // The verbose_json format with segment granularity gives us an array of segments
  const segments = (response as any).segments;
  if (!segments || !Array.isArray(segments)) {
    throw new Error("Failed to get segments from Whisper API");
  }

  return segments.map((seg: any) => ({
    startSeconds: seg.start,
    endSeconds: seg.end,
    text: seg.text.trim(),
  }));
}
