# Visual reference

The reference is the original [Raft visualization](../../raft/) and its keyed, centered object layout in `raft/scripts/layout/`. The current direction follows the user’s explicit refinement: keep the top bar, a white canvas, one caption and grouped Replay/Continue controls. The earlier [concept](raft-style-concept.png) is design history and does not define the current controls.

## Presentation

- White canvas, a narrow pale-gray navbar, RU/EN and the chapter menu.
- Helvetica/Arial captions and controls; Courier New diagram labels. Steelblue servers, green clients, black outlines and restrained colored messages.
- No visible chapter counter, step count, speed selector, playback toolbar, secondary diagram caption or experiment controls. Chapter names remain in the document title, menu and screen-reader heading. Sources are available through About this step in the menu.
- Replay and Continue appear after the finite animation completes. Keyboard arrows revisit or advance ready scenes. Reduced motion shows the final composition immediately.

## Motion

`composition.js` groups each diagram into semantic actors with locale-independent keys and explicit anchors. A table and its entries move together. `motion.js` interpolates the previous and next actor positions, grows incoming actors from the current focal object, and fades departing actors. The first actor is introduced at the center before the composition expands.

Request stages grow from one centered socket to a centered two-, three-, four- and five-part pipeline; mobile uses a growing vertical chain. The first key begins with one client, introduces Redis and then makes room for memory. New tables, background workers, snapshot children and pending-work groups change the occupied composition.

Layout finishes before messages travel. Existing values remain visible until the causal state change, and replies follow mutations. All animation phases use the same finite, pausable timeline, so language changes and background-tab pauses preserve progress and canceled scenes cannot unlock a later scene. Durations illustrate a teaching sequence, not server performance.

Story length follows the material: the first key has seven stops, with replacement and deletion separated; dictionary lookup has five, combining hashing and bucket selection. The remaining chapters retain their authored six stops. The shared beat map keeps diagrams, captions, scores and pinned evidence aligned.
