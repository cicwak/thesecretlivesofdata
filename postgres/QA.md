# Local acceptance — 19 October 2026

The course contains 70 chapters and 400 stops, each available in Russian and
English. The chapter sequence, questions, outcomes and source references are
recorded in [STORYBOARD.md](STORYBOARD.md).

## Results

- `npm run test:postgres`: 87 passing tests for course integrity, routing,
  causal scores and playback.
- `npm run test:redis`: 145 passing regression tests.
- `python3 postgres/tests/native_postgres.py`: 15 passing checks against a
  disposable pinned PostgreSQL cluster, including physical and logical replicas.
- Real-browser audit: 1,600 language/layout scene variants, 21,634 text elements,
  1,704 message routes and 70 animated transitions; zero reported failures.
- Manual browser checks: desktop and 390 × 844 phone layout; RU/EN changes
  during playback; reduced motion; replay; controls blocked until playback
  completes; links from the catalog to the article and from the article to the
  player. Screenshots are in `design/`.
- Hugo draft build and release integrity checks passed. A separate build
  without drafts excluded the article and its catalog entry.
- Both repositories passed `git diff --check`.

## Reviewable local result

- Course: <http://127.0.0.1:18082/visualizations/postgres/?lang=ru#first-order>
- English: <http://127.0.0.1:18082/visualizations/postgres/?lang=en#first-order>
- Article: <http://127.0.0.1:18082/articles/postgres-internals/>

This report records the local checks before publication. The preview runs
locally and is not a hosted public URL. Chapter title cards were also verified
in both languages, desktop and compact layouts, including manual continuation,
backwards navigation and the reduced-motion setting.

Source versions, link-check evidence, pinned implementation references and
limits of the native behavioral checks are documented in [audit/README.md](audit/README.md).
