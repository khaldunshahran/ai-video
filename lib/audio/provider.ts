export interface AudioSource {
  url: string;
}

export interface ExtractedAudio {
  filePath: string;
  title: string;
  durationSeconds: number;
}

export interface AudioProvider {
  extract(source: AudioSource): Promise<ExtractedAudio>;
}
