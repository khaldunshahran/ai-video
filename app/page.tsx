"use client";

import { createProject } from "./actions";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    try {
      const id = await createProject(formData);
      router.push(`/${id}`);
    } catch (err) {
      alert(String(err));
    }
  }

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
          <form action={handleSubmit}>
            <label htmlFor="source">Video or podcast URL</label>
            <input id="source" name="source" placeholder="https://www.youtube.com/watch?v=..." required />
            <button type="submit">Create transcript job</button>
          </form>
          <p>Jobs run out-of-band so a chunk failure can retry without restarting the full episode.</p>
        </div>
      </section>
    </main>
  );
}
