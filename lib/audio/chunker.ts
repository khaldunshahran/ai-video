import { spawn } from "node:child_process";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface AudioChunk {
  filePath: string;
  chunkIndex: number;
  offsetSeconds: number;
}

/**
 * Splits an MP3 file into chunks of roughly `chunkDurationSeconds`
 */
export async function splitAudio(filePath: string, chunkDurationSeconds: number = 600): Promise<AudioChunk[]> {
  const outputDir = await mkdtemp(join(tmpdir(), "highlight-chunks-"));
  const outputPattern = join(outputDir, "chunk-%03d.mp3");

  await runCommand("ffmpeg", [
    "-i", filePath,
    "-f", "segment",
    "-segment_time", chunkDurationSeconds.toString(),
    "-c", "copy", // fast copy without re-encoding
    outputPattern,
  ]);

  const files = await readdir(outputDir);
  const chunks = files
    .filter((f) => f.startsWith("chunk-") && f.endsWith(".mp3"))
    .sort()
    .map((f, i) => ({
      filePath: join(outputDir, f),
      chunkIndex: i,
      offsetSeconds: i * chunkDurationSeconds,
    }));

  return chunks;
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} exited with ${code}: ${stderr}`));
    });
  });
}
