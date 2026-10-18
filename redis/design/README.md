# Visual reference

The approved reference is [raft-style-concept.png](raft-style-concept.png), generated with the built-in `image_gen` tool and approved during implementation. It uses the original [Raft visualization](https://thesecretlivesofdata.com/raft/) as its reference.

## Design system

- White canvas; a narrow `#f8f8f8` navbar with a fine gray border.
- Helvetica/Arial narrative and controls; monospace technical annotations.
- Steelblue Redis servers, green clients, dark outlines, restrained message dots.
- A central explanation diagram, a short narrative near the bottom and small bordered player controls.
- Contents, detailed explanations and experiments open on demand. No permanent sidebar or marketing section.
- Live text, controls, SVG shapes and state; the mockup is not used as the interface.

## Final concept prompt

> Create a revised complete UI concept for Redis Internals using the attached ORIGINAL RAFT SCREENSHOT as the explicit visual reference. User requests much closer to original Raft. Match its simplicity, white full-screen canvas, Helvetica/Arial type, narrow very light gray navbar, huge negative space, simple blue server circles and green client circles, monospace diagram annotations, centered short explanation near bottom, small Bootstrap-style Continue/Replay buttons. No permanent sidebar, no dashboard cards, no large top heading, no red Redis logo branding, no marketing section. Full desktop screenshot around1440x1000. Top narrow navbar only: left 'The Secret Lives of Data'; right small 'RU / EN' and hamburger button. Under topbar very subtle centered chapterlabel 'Redis · 01 / 21 · The life of a key'. Main wide whitespace diagram centered in middle: green outlined circle left labeled 'Client A'; blue filled circle right labeled 'Redis', with simple black monospaced rectangular memory key-value annotation beneath it 'user:1 → Alice'. One blue line arrow moving from client toward server, monospace command 'SET user:1 Alice' above line and small reply '+OK' returning below. Simple shapes in style of Raft screenshot, not decorated or nested frames. A few small colored moving message dots on arrows. Bottom centered text in large dark gray Helvetica around28px: 'Redis stores the value in memory.' second line 'The key is the name used to find it again.' Under explanation a small bordered control group: replay icon, 'Continue ›'. Under controls a quiet utility line in small muted text '3 / 6 · 1× · Under the hood · Try it yourself'. Bottom tiny centered 'Redis Open Source 8.0 · Learning model'. Show complete primary screen, do not render a browser chrome or outerframe. Contents opens from hamburger, details and lab open on demand, hence not visible in this primary screen. All text readable and native UI implemented later. Maintain almost exactly original Raft's proportions and humble functional visual character. This is the final interface concept, not a new design direction.

## Content and behavior additions required by the plan

The actual chapter names and explanations come from the authored bilingual curriculum, rather than the illustrative mockup copy. Previous, play/pause, keyboard focus and reduced-motion states implement the agreed player requirements. Internal structures use tables, buffers and timelines where circles alone would obscure their meaning. Narrow screens use compact diagrams and can open the full diagram separately.
