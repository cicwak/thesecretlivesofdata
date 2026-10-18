# Redis verification

Verified locally on 2026-10-18. This records the implemented static site, not a production deployment.

## Automated checks

`npm run test:redis`: **109 passed**, using Node's built-in runner without external packages.

Coverage includes 21 stable chapters, 126 bilingual steps, desktop and compact SVG states, interface translations and language precedence, immutable experiment state, request parsing, counter races, WATCH, transaction/script errors, blocking clients, lock ownership, expiry/eviction, persistence, replication, failover, CRC16 Cluster slots, Pub/Sub and Stream acknowledgment/reclaim behavior.

The refinement adds explicit choreography coverage for all 126 steps and playback tests for completion gating, pause/rate changes, cancellation of an old scene, rebuilding at an elapsed position and immediate reduced-motion completion. Every short caption is checked in both languages, with its full explanation retained in `step.detail`.

The subsequent [technical audit](audit/README.md) checked all 126 steps against official documentation and pinned Redis 8.0.0 source, including its selected module releases. The new evidence map covers every step; all 229 code file/line references were validated against their exact checkout. Behavioral corrections add WATCH dirty-state, SET encoding, incremental rehash completion, conditional UNLINK, ASKING, recovery and acknowledgment tests.

The optional `native_redis8.py` suite also passed **15 real Redis 8.0.0 integration tests**, using no Python packages and only disposable private Unix-socket servers. Additional isolated checks covered encodings and local Cluster script rules. Modules were source-reviewed rather than executed. Real power cuts and an exhaustive distributed failover matrix were not tested.

JavaScript syntax checks and `git diff --check` pass. The legacy Raft/PhantomJS suite is unchanged; it is separate from `test:redis`.

## Browser checks

Used the Codex in-app browser against `http://127.0.0.1:8080/redis/`. No Playwright Chromium fallback was needed.

- Walked all six steps in all 21 chapters and opened every experiment.
- Completed a fresh native-animation walk through all **126 revised story steps** at 2×. Direct button-handler checks verified the busy gate, eventual unlock and visible settled values; there were no console errors or uncaught runtime exceptions. Median playback in the measured native batches was about 1.48 seconds at 2×. Targeted fresh-module checks cover the final lock/Stream and ghost fixes.
- Measured all **504 diagram states** (21 chapters × 6 steps × 2 languages × 2 layouts) in the browser: no labels outside the viewBox, no overlapping labels and no text overflowing explanatory boxes. Compact layouts use a native 420 × 360 viewBox with labels of at least 14 SVG units.
- Exercised the lost-update experiment through the UI: GET/SET gives 11; two INCR commands give 12.
- Switched RU/EN inside an open experiment: the current chapter, step, stored value and modal remained intact.
- Checked contents links, direct chapter links, Previous, Replay, keyboard arrows, skip-to-explanation focus and browser history after changing language.
- Checked reduced motion using browser emulation: motion stops, the explanation remains visible, and playback-only controls are disabled. Removed emulation afterwards.
- Rechecked the revised native diagrams: **504 renders**, with zero clipped labels, label overlaps or text overflowing its data container; all animation message roles are present and stable keys are unique. Fixed mobile RPUSH/TTL labels, the Sentinel discovery route and Stream reply labels.
- Paused a real Web Animation at 91 ms: Next and Replay remained disabled; ArrowRight did not advance. Switching RU/EN preserved that elapsed position and pause, and selecting 2× changed every animation's playback rate without restarting it. Resuming unlocked controls only after completion.
- Inspected the separate SET Bob and DEL beats: Bob appears after the first request, its OK reply returns while Bob remains stored, and only the second operation removes the key. The enlarged static diagram shows only the settled state.
- Rebuilt a scene at 1800 ms, resumed and switched language during playback: already-completed early phases stayed complete. A regression test covers Web Animations' automatic rewind when `play()` is called at an animation's end.
- Sampled eight targeted lock/Stream variants (two chapters × two languages × two layouts) before and after their second mutation: an expired lock and PEL-A appear first; token B, its timeline and PEL-B remain hidden until acquisition/claim. Old TTL and endpoint-command labels do not overlap their replacements. The targeted audit again found zero clipping and label overlaps.
- Checked the native concept dimensions **1504 × 1046**, the normal in-app viewport **846 × 1034**, and mobile **390 × 844**. Temporary viewport overrides are reset before handoff.
- After the source audit, reran all 504 SVG variants: zero clipping, overlaps, text-container overflow, missing animation roles or duplicate keys. Twenty native WAAPI samples checked RDB restore, AOF prefix/suffix loss and WAIT/WAITAOF reply ordering. Corrected labels and the rejected lock reply's destination. Checked the new per-step source section and language switching in the live details dialog with no console errors.

## Visual comparison

Compared the running original Raft with the revised Redis player, including the original 500 ms node transitions and 600 ms control reveal. Current screenshots are inspected with `view_image` in the same review pass. The earlier [approved concept](design/raft-style-concept.png) remains in the repository as design history.

| Point | Implemented result |
| --- | --- |
| Composition | White full-screen canvas, narrow gray navbar, central diagram and bottom-centered narrative. |
| Navigation | Contents opens from the hamburger; no permanent sidebar. RU/EN remains unobtrusive in the navbar. |
| Typography | Helvetica/Arial for narrative and controls; Courier New diagram labels and commands. One short thought per screen, with the full explanation in Under the hood. |
| Palette | White background, steelblue servers, green clients, dark outlines and restrained message dots. No decorative gradients or rasterized controls. |
| Controls | Raft-style grouped Replay/Continue controls fade in after playback; Previous, pause, speed, details and experiments sit on a quiet utility row. Navigation is disabled until all animations finish. |
| Responsive diagrams | Native compact diagrams on narrow screens; the full diagram can be opened and panned separately. Dialog text and state tables wrap without page overflow. |
| Assets and interaction | Native SVG circles and square entries. Request, state change and reply play in causal order; moving messages follow displayed paths. Pause and speed affect the entire finite score. |

Intentional differences from the illustrative concept: chapter names and explanations use the full authored curriculum and its Russian translation; Previous and play/pause are required by the approved plan; complex structures use tables and timelines; narrow screens reorganize diagrams vertically. The visible-copy check found no added marketing claims, badges, dashboard navigation or decorative sections.

Material issues fixed during verification: skip-link navigation originally reset the chapter; long Russian modal headings needed wrapping; event logs now reveal the newest result; wide diagrams needed native mobile layouts rather than shrinking their labels. The final presentation follows the approved Raft-style composition.

Screenshots:

- [Original Raft reference](/Users/kostya/.codex/visualizations/2026/10/18/01a14f80-0cee-7553-a08d-53e5d548176e/raft-reference.png)
- [Desktop](/Users/kostya/.codex/visualizations/2026/10/18/01a14f80-0cee-7553-a08d-53e5d548176e/redis-desktop.png)
- [Mobile](/Users/kostya/.codex/visualizations/2026/10/18/01a14f80-0cee-7553-a08d-53e5d548176e/redis-mobile.png)
- [Per-step source evidence](/Users/kostya/.codex/visualizations/2026/10/18/01a14f80-0cee-7553-a08d-53e5d548176e/redis-source-audit.png)

## Limits of the model

This is an educational simulation, not a Redis emulator or benchmark. Scheduling, capacity and failure timing are deliberately small and deterministic, with simplifications described beside each experiment. Specialized structures remain an architectural overview. The baseline is Redis Open Source 8.0; original Redis command names and replies are not translated.
