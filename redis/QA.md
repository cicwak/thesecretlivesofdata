# Redis verification

Verified on 2026-10-18 for the minimal player and centered actor motion.

## Automated checks

`npm run test:redis`: **124 passed** with Node’s built-in runner and no external packages. Coverage includes the bilingual curriculum, chapter routes, scene variants, semantic composition and stable keys, beat mapping, pinned documentation/source evidence, causal choreography, completion gating/cancellation, language-time restoration and the internal deterministic Redis models.

The first-key chapter now has seven stops (SET Bob and DEL are separate), dictionary lookup has five (hashing and bucket selection share one stop), and the other chapters have six. The shared beat map preserves all original audited mechanisms and evidence.

## Browser verification

A temporary in-browser harness rendered all **504 settled variants**: every story stop in both languages, at desktop and compact widths. It checked keys, actor anchors, accessibility names and **4,370 visible text bounds**. It then sampled **136 transitions**, checking **1,648 actor positions** at initial, intermediate and final times. Final result: **zero failures**.

Material issue fixed during this pass: text-only I/O/background actors must be included when centering the event-loop scene; excluding them moved the labels beyond the right edge.

Manual checks in the in-app browser:

- The request begins with one socket at the center; the input buffer and subsequent processing stages enter while the earlier objects move. Native compact diagrams reorganize this into a growing vertical chain.
- The main player has only the top bar, diagram, one caption and grouped Replay/Continue controls. Chapter titles are screen-reader headings and document titles; chapter and step counts, speed, pause/back/zoom buttons, diagram footnotes and experiments are absent from the main canvas.
- Replay starts the same sequence again. Navigation stays disabled until every animation and the 600 ms controls reveal finish.
- Switching English to Russian during replay retains the chapter/step and the running, locked state. Keyboard navigation and chapter links remain available.
- The complete six-stop request was traversed at **390 × 844** with no horizontal overflow. Caption text remains 21 px, and all five processing stages fit in the compact scene.
- Reduced motion immediately produces the settled state and enables Continue; Replay is disabled. Temporary device/media overrides were reset.
- Replies travel from the output buffer back to the socket; Sentinel role labels change during promotion rather than before it. Different encoding/feature topics have distinct identities so unrelated structures do not morph into one another.

## Visual comparison

The reference is the running original Raft at the normal **1280 × 720** viewport. The current presentation follows the user’s explicit refinement of that reference. The earlier images in `design/qa/` record design history.

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
