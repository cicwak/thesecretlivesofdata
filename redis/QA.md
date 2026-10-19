# Redis verification

Verified on 2026-10-18 for the minimal player and centered actor motion.

## Automated checks

`npm run test:redis`: **124 passed** with Node’s built-in runner and no external packages. Coverage includes the bilingual curriculum, chapter routes, scene variants, semantic composition and stable keys, beat mapping, pinned documentation/source evidence, causal choreography, completion gating/cancellation, language-time restoration and the internal deterministic Redis models.

The first-key chapter now has seven stops (SET Bob and DEL are separate), dictionary lookup has five (hashing and bucket selection share one stop), and the other chapters have six. The shared beat map preserves all original audited mechanisms and evidence.

## Browser verification

A temporary in-browser harness rendered all **504 settled variants**: every story stop in both languages, at desktop and compact widths. It checked keys, actor anchors, accessibility names and **4,370 visible text bounds**. It then sampled **136 transitions**, checking **1,648 actor positions** at initial, intermediate and final times. Final result: **zero failures**.

Material issues fixed during this pass: text-only I/O/background actors must be included when centering the event-loop scene; excluding them moved the labels beyond the right edge. Final screenshot comparison also caught a command label crowded inside the request buffer: redundant separators were removed, command checks were split over two lines, and all six settled Russian request states were checked against their own container bounds without overflow.

Manual checks in the in-app browser:

- The request begins with one socket at the center; the input buffer and subsequent processing stages enter while the earlier objects move. Native compact diagrams reorganize this into a growing vertical chain.
- The main player has only the top bar, diagram, one caption and grouped Replay/Continue controls. Chapter titles are screen-reader headings and document titles; chapter and step counts, speed, pause/back/zoom buttons, diagram footnotes and experiments are absent from the main canvas.
- Replay starts the same sequence again. Navigation stays disabled until every animation and the 600 ms controls reveal finish.
- Switching English to Russian during replay retains the chapter/step and the running, locked state. Keyboard navigation and chapter links remain available.
- The complete six-stop request was traversed at **390 × 844** with no horizontal overflow. Caption text remains 21 px, and all five processing stages fit in the compact scene.
- Reduced motion immediately produces the settled state and enables Continue; Replay is disabled. Temporary device/media overrides were reset.
- Replies travel from the output buffer back to the socket; Sentinel role labels change during promotion rather than before it. Different encoding/feature topics have distinct identities so unrelated structures do not morph into one another.

## Visual comparison

The reference is the running original Raft at **1280 × 720**. The final Hugo rendering was also inspected at the user’s **846 × 1034** viewport; screenshots were compared with `view_image`. The current presentation follows the user’s explicit refinement of that reference. The earlier images in `design/qa/` record design history.

| Point | Current result |
| --- | --- |
| Composition | White canvas; the first actor occupies the center, and membership changes recenter the occupied diagram. |
| Controls | Only Replay and Continue beneath the caption; details and sources are inside the chapter menu. |
| Typography | Helvetica/Arial narration and controls; Courier New technical labels. No visible chapter badge or duplicate diagram caption. |
| Palette and shapes | Steelblue servers, green clients, square data entries, black outlines, red requests and hollow reply dots. |
| Movement | Stable semantic actor identities, interpolated positions, growth from the focal object and departing-object fades. |
| Causality | Layout settles before traffic, old values remain until mutation, and replies follow the appropriate state change. |
| Responsive behavior | Native compact diagrams keep technical text readable, with no horizontal page overflow. |

Intentional differences from Raft: Redis buffers and internal structures use rectangular entries where circles would obscure their meaning; technical evidence is retained behind the menu; the presentation has complete RU/EN localization. No new decorative labels or toolbars were added.

## Scope

The browser model illustrates Redis Open Source 8.0.0. Timing and capacity are explanatory, not benchmarks. Atomic execution, rollback, persistence and replication remain separate concepts. This UI refinement preserves the pinned technical audit and deterministic model tests; it does not claim to have rerun the optional native Redis binary suite.

## Local follow-up: event-loop routing

The local review found that the desktop replies pointed into empty space and the compact replies went below the server instead of back to the clients. Corrected `+OK → A` and `"Alice" → B` in both layouts, and docked all three request paths at the Redis circle. Request/mutation/reply ordering is unchanged.

`npm run test:redis`: **126 passed**, including circle-boundary routing checks for both languages and layouts and the absence of a reply while the script remains busy. Desktop and 390 × 844 views were manually checked for both replies. This review was performed in the local Hugo preview before publication approval.

## Local follow-up: routing across all 21 chapters

Audited every request, reply and internal transfer in both languages and both layouts. Each flow now declares semantic source/recipient keys. Corrected client ownership in atomicity, transactions, scripting, blocking commands and leases; replica acknowledgements and PSYNC direction; WAIT/WAITAOF and Sentinel replies; MOVED/ASK redirects; Pub/Sub delivery and Stream entry/PEL routes. TTL and memory-limit client commands now have visible client endpoints. Dictionary, encoding, persistence and specialized-structure transfers meet their visible objects. The existing causal ordering and minimal player controls are preserved.

`npm run test:redis`: **145 passed**, including endpoint existence and semantic routing regressions. The reusable `tests/routing-browser.html` passed **504 scene variants**, **962 routes**, **3,360 endpoint checks**, **718 moving messages** and **4,414 text-bound checks**, with **zero failures**. This uses actual browser SVG geometry, including nested actor translations, and checks endpoints again halfway through each scored message flight after actor reflow. A 12-SVG-unit boundary tolerance allows arrowhead clearance; moving dots must remain within 2 units of their displayed path.

The corrected runtime files were copied into the local Hugo source and its running preview. The desktop and 390 × 844 BLPOP wake-up views were also inspected in that preview: the producer sends RPUSH to Redis and the waiting client A receives the item. No push or deployment was performed during this local review; publication is a separate operation following explicit user approval.

## Local follow-up: Raft chapter transitions

The reference is the original `raft/scripts/frames/election.js` and `replication.js`: clear the diagram, pause on white, reveal the chapter title and controls, and wait for Continue before entering the first scene. Title/controls fades use the same 600 ms duration as `scripts/tsld/tsld.js`; the chapter opens after a 500 ms white pause. Redis also fades the outgoing screen to white instead of removing it abruptly. These cards appear between chapters, not between every command or animation beat.

There are 21 separate title stops and the same 126 audited Redis scenes. Direct links and the chapter menu open the title; Continue enters scene zero. Left/Right navigation visits the title in the correct order; browser history retains the current view. Title transitions share Playback's finite clock, so cancellation, language changes, breakpoint changes and background pause preserve animation progress. Outgoing screens have no duplicate IDs and are inert and hidden from assistive technology; keyboard focus follows the incoming title or caption. Reduced motion settles immediately.

`npm run test:redis`: **160 passed**. The real browser integration page `tests/chapter-browser.html` passed **84 title screens**, **504 scenes**, **84 title-to-scene visibility checks**, **4 Back/Forward round trips** and **4 keyboard return/advance checks**, with **zero failures**, across RU/EN and 960/390 px layouts. It checks the actual player, advances every scene, and samples real Web Animations during the white pause. Local Hugo was also manually checked for changing language and viewport during title reveal and for immediate navigation with reduced motion. Its full release checker resolves both new runtime imports.

Source work is isolated on `feature/redis-chapter-transitions`; the local blog adapter is on `feature/blog-redis-chapter-transitions`. Existing PostgreSQL work in the other checkouts was not modified. This review was completed locally before separate publication approval.
