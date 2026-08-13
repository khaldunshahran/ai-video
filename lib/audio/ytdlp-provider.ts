import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AudioProvider, AudioSource, ExtractedAudio } from "./provider";

export class YtDlpAudioProvider implements AudioProvider {
  async extract(source: AudioSource): Promise<ExtractedAudio> {
    const outputDir = await mkdtemp(join(tmpdir(), "highlight-audio-"));
    const outputTemplate = join(outputDir, "audio.%(ext)s");
    const metadata = await runJson(source.url);
    await runCommand("yt-dlp", ["--extract-audio", "--audio-format", "mp3", "--output", outputTemplate, source.url]);

    return {
      filePath: join(outputDir, "audio.mp3"),
      title: metadata.title ?? source.url,
      durationSeconds: Math.round(metadata.duration ?? 0),
    };
  }
}

async function runJson(url: string): Promise<{ title?: string; duration?: number }> {
  const stdout = await runCommand("yt-dlp", ["--dump-single-json", "--no-playlist", url]);
  return JSON.parse(stdout) as { title?: string; duration?: number };
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
