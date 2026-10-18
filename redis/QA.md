# Redis verification

Verified locally on 2026-10-18. This records the implemented static site, not a production deployment.

## Automated checks

`npm run test:redis`: **82 passed**, using Node's built-in runner without external packages.

Coverage includes 21 stable chapters, 126 bilingual steps, desktop and compact SVG states, interface translations and language precedence, immutable experiment state, request parsing, counter races, WATCH, transaction/script errors, blocking clients, lock ownership, expiry/eviction, persistence, replication, failover, CRC16 Cluster slots, Pub/Sub and Stream acknowledgment/reclaim behavior.

JavaScript syntax checks and `git diff --check` pass. The legacy Raft/PhantomJS suite is unchanged; it is separate from `test:redis`.

## Browser checks

Used the Codex in-app browser against `http://127.0.0.1:8080/redis/`. No Playwright Chromium fallback was needed.

- Walked all six steps in all 21 chapters and opened every experiment.
- Measured all **504 diagram states** (21 chapters × 6 steps × 2 languages × 2 layouts) in the browser: no labels outside the viewBox, no overlapping labels and no text overflowing explanatory boxes. Compact layouts use a native 420 × 360 viewBox with labels of at least 14 SVG units.
- Exercised the lost-update experiment through the UI: GET/SET gives 11; two INCR commands give 12.
- Switched RU/EN inside an open experiment: the current chapter, step, stored value and modal remained intact.
- Checked contents links, direct chapter links, Previous, Replay, keyboard arrows, skip-to-explanation focus and browser history after changing language.
- Checked reduced motion using browser emulation: motion stops, the explanation remains visible, and playback-only controls are disabled. Removed emulation afterwards.
- Checked the native concept dimensions **1504 × 1046**, the normal in-app viewport **846 × 1034**, and mobile **390 × 844**. Temporary viewport overrides are reset before handoff.

## Visual comparison

Inspected both the [approved concept](design/raft-style-concept.png) and browser screenshots with `view_image` in the same review pass.

| Point | Implemented result |
| --- | --- |
| Composition | White full-screen canvas, narrow gray navbar, central diagram and bottom-centered narrative. |
| Navigation | Contents opens from the hamburger; no permanent sidebar. RU/EN remains unobtrusive in the navbar. |
| Typography | Helvetica/Arial for narrative and controls; monospace diagram labels and commands. Narrative reaches 29 px on the native-size desktop. |
| Palette | White background, steelblue servers, green clients, dark outlines and restrained message dots. No decorative gradients or rasterized controls. |
| Controls | Small bordered Previous/Replay/Next controls; speed, details and experiments on a quiet utility row. |
| Responsive diagrams | Native compact diagrams on narrow screens; the full diagram can be opened and panned separately. Dialog text and state tables wrap without page overflow. |
| Assets and interaction | All diagrams are native SVG, not screenshots. Moving messages follow displayed paths, and pause, replay and speed affect their playback. |

Intentional differences from the illustrative concept: chapter names and explanations use the full authored curriculum and its Russian translation; Previous and play/pause are required by the approved plan; complex structures use tables and timelines; narrow screens reorganize diagrams vertically. The visible-copy check found no added marketing claims, badges, dashboard navigation or decorative sections.

Material issues fixed during verification: skip-link navigation originally reset the chapter; long Russian modal headings needed wrapping; event logs now reveal the newest result; wide diagrams needed native mobile layouts rather than shrinking their labels. The final presentation follows the approved Raft-style composition.

Screenshots:

- [Desktop](/Users/kostya/.codex/visualizations/2026/10/18/01a14f80-0cee-7553-a08d-53e5d548176e/redis-desktop.png)
- [Mobile](/Users/kostya/.codex/visualizations/2026/10/18/01a14f80-0cee-7553-a08d-53e5d548176e/redis-mobile.png)

## Limits of the model

This is an educational simulation, not a Redis emulator or benchmark. Scheduling, capacity and failure timing are deliberately small and deterministic, with simplifications described beside each experiment. Specialized structures remain an architectural overview. The baseline is Redis Open Source 8.0; original Redis command names and replies are not translated.
