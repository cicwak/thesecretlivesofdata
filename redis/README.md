# Redis изнутри / Redis Internals

A static, bilingual, interactive explanation of Redis Open Source 8.0.0. All 21 chapters run locally in the browser; there is no Redis dependency, backend, analytics, or remote font requirement.

## Run

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/redis/?lang=ru#first-key` (or `lang=en`). Serve over HTTP: ES modules do not work reliably from `file://` URLs. Deploy the repository as static files, preserving the `/redis/` directory.

## Verify

```sh
npm run test:redis
```

These tests use Node's built-in test runner and need no installed npm packages. The repository's existing `npm test` remains the legacy Raft/PhantomJS runner.

Browser checks: complete a story, revisit a previous step, use the chapter menu and direct links, switch RU/EN during an animation, and replay a step. Check narrow and wide viewports, keyboard controls, and reduced motion. Internal model tests cover counter interleavings, transactional errors, WATCH, blocking clients, lease ownership, expiry and eviction, persistence, replication, failover, cluster slots, Pub/Sub and Streams.

## Structure

- `content.js`: a shared route with complete Russian and English narratives, deeper explanations and official primary sources.
- `scenes.js`: native SVG diagrams generated from the current chapter and story step.
- `choreography.js`: explicit request, mutation, reply and waiting sequences for every step.
- `motion.js` and `playback.js`: finite Web Animations and their completion, pause, rate and cancellation handling.
- `model.js`: deterministic states and reducers retained for internal verification; the player does not load this module.
- `i18n.js`: interface translations and language/link selection.
- `evidence.js` and `audit/`: a per-step map of official documentation and immutable implementation references, plus the full 126-step technical audit.
- `app.js` and `redis.css`: the accessible learning player and responsive presentation.
- `STORYBOARD.md`: side-by-side scripts for the first three chapters.

Changing language preserves the story step and animation progress. Explicit `?lang=ru|en` wins over the saved preference, then the first browser language is used (`ru` → Russian, otherwise English). Storage being unavailable does not prevent the player working. Chapters use stable hash identifiers.

Each screen introduces one idea. The original, longer explanation remains in the current step's **Under the hood** dialog. Navigation and replay unlock only after every animation, including the Raft-style 600 ms controls reveal, has finished. Pause keeps this gate closed. Speed changes preserve elapsed story time; language changes rebuild the same score at that time. Reduced motion shows the settled state immediately. Animation durations illustrate causality, not server latency.

Narrow screens use native compact diagrams rather than shrinking desktop labels. The full diagram can also be opened separately. See [verification evidence](QA.md) and the [Raft visual reference](design/README.md).

## Educational boundaries

This is an illustrated explanation, not a Redis emulator or benchmark. Timing, capacity and scheduling are illustrative. Execution isolation, durable persistence and replication are explained separately. The ordinary command execution path is primarily sequential, while Redis also uses I/O threads, background threads and child processes. Scheduling of clients is not a promise of global FIFO fairness. Runtime errors do not imply automatic rollback. Asynchronous replication and WAIT do not provide Raft's guarantees. An expiring distributed lease alone cannot fence stale writes to an external resource.

Redis 8.0.0 at commit `e91a340e241cf0abe3c6a0c254214fbe4aa1d95f` is the fixed implementation baseline. Later-version features must be marked separately. Specialized structures are an overview; Redis Software/Cloud deployment internals and third-party forks are outside this route.

The [technical audit](audit/README.md) records every step's evidence and corrections. Under the hood shows its own documentation and pinned source links. The optional `tests/native_redis8.py` checks real Redis behavior with an explicitly supplied 8.0.0 binary; it creates private temporary servers and is not required to run the site or its Node tests.
