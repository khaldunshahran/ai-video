import { mockCandidateMoments, mockTranscriptSegments } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/time";

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <div className="eyebrow">Phase 1-first workflow</div>
          <h1>Paste a podcast link. Find the moments worth cutting.</h1>
          <p>
            This v1 keeps the product intentionally lean: extract audio, build a canonical timestamped transcript,
            rank candidate moments with rationale, then jump to the source so you can cut manually.
          </p>
        </div>
        <div className="card">
          <form>
            <label htmlFor="source">Video or podcast URL</label>
            <input id="source" placeholder="https://www.youtube.com/watch?v=..." />
            <button type="button">Create transcript job</button>
          </form>
          <p>Jobs run out-of-band so a chunk failure can retry without restarting the full episode.</p>
        </div>
      </section>

      <section className="grid" aria-label="Podcast review workspace">
        <div className="panel">
          <h2>Ranked candidates</h2>
          {mockCandidateMoments.map((moment) => (
            <article className="moment" key={moment.id}>
              <div className="meta">{formatTimestamp(moment.startSeconds)}–{formatTimestamp(moment.endSeconds)} · Score {moment.score}/10 · {moment.tag}</div>
              <strong>{moment.rationale}</strong>
              <p>Accept, reject, or adjust boundaries to capture the feedback loop from day one.</p>
            </article>
          ))}
        </div>
        <div className="panel transcript">
          <h2>Merged transcript</h2>
          {mockTranscriptSegments.map((segment) => (
            <div className="segment" key={segment.id}>
              <code>{formatTimestamp(segment.startSeconds)}</code>
              <span>{segment.text}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
