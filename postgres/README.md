# Postgres

70 bilingual, causal stories: an application saves its first order, then opens
the mechanisms that make storage, concurrency, queries and replication work.
Native SVG and ES modules; no server application or build step is required.

Serve the repository over HTTP and open `/postgres/?lang=ru#first-order`.
The matching Hugo route is `/visualizations/postgres/`; the accompanying draft
article is `/articles/postgres-internals/`.

## Checks

```sh
npm run test:postgres
npm run test:redis
python3 postgres/tests/native_postgres.py
```

Open `/postgres/tests/browser.html` for real-browser geometry, routing and
finite-animation checks across both languages and native compact layouts.
The native check launches a disposable pinned PostgreSQL container without a
network, host credentials, bind-mounted database or published port. It removes
the entire test cluster after completion. Docker is needed only for this check.

## Authoring

`chapters/` is the editorial source. Every stop couples a short visible caption
with a fuller explanation, SQL, semantic actors, causal flows and primary
documentation. `AUTHORING.md` documents the small vocabulary. Actor kinds
render actual tables, pages, trees, plans, spatial partitions, WAL entries,
queues, bitmaps and transaction state. The renderer packs present actors;
the shared Redis motion preserves their identity between steps.

The first seven chapters establish saving, reading, grouping changes and
finding stored data. Durability introduces WAL before XID metadata. Concurrency
then motivates versions, snapshots, locks and cleanup. A slow query introduces
plans, JOINs and specialized indexes. Shared write behavior motivates triggers;
the last seven stories follow data across servers.

Details open through the chapter menu, keeping the primary canvas minimal.
Between chapters a white title card introduces the next question and waits
for Continue, following the original Raft chapter screens. Direct links and
the contents menu open the same card, except the first chapter, which starts
with the application. These cards preserve all 400 database story stops.
Hidden tabs pause playback; language and layout changes preserve elapsed time;
reduced motion settles immediately. Continue waits for every animation,
including the controls reveal. Timing and capacities are explanatory.

## Hugo

```sh
python3 postgres/tools/sync_hugo.py /absolute/blog/site/static/visualizations/postgres
```

This copies only the Postgres runtime, chapters, provenance and licenses. Hugo
copies that tree unchanged as static files. Its catalog and Markdown article
are maintained in the blog repository. Publication is a separate operation.
