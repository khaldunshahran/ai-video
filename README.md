# Podcast Highlight Finder

A lean Next.js prototype for finding podcast/video highlights faster without rendering, captioning, or auto-cropping.

## v1 scope

1. Extract audio from a pasted link behind an `AudioProvider` interface.
2. Run transcription as retryable jobs and merge chunk-local timestamps into one canonical episode timeline.
3. Score candidate moments with structured rationale and snap boundaries deterministically to transcript segments.
4. Review candidates beside the transcript and record accept/reject decisions plus manually adjusted boundaries.

## Commands

- `npm run dev` starts the app.
- `npm run test` runs pipeline unit tests.
- `npm run build` creates a production build.
