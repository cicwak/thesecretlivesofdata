# Postgres course verification

This audit covers **70 chapters and 400 bilingual causal stops**. The public
course is called Postgres; PostgreSQL 18 is the technical baseline.

## Documentation and book links

[links.json](links.json) records the live source-link check made on
**19 October 2026, 00:05 Moscow time** (18 October, 21:05 UTC).

- All **109 unique documentation URLs across 103 HTML pages** returned HTTP 200.
- Each documentation fragment was checked against actual HTML `id` attributes
  or legacy named anchors, rather than treating a successful page request as
  proof that its section exists.
- The [Rogov book PDF](https://edu.postgrespro.ru/postgresql_internals-18.pdf)
  returned HTTP 200 with `application/pdf` content type.
- No failed URLs or missing fragment targets were found in this snapshot.

Documentation was fetched with bounded concurrency of six requests. The JSON
includes each requested URL, check time, HTTP status, final URL and fragment
result. The book used an HTTP HEAD existence check; that check does not validate
every printed-page attribution. Links and online documentation can change
after this snapshot.

## Selected implementation evidence

[source-map.js](source-map.js) maps **51 chapters** to **47 unique source
ranges in 35 upstream source files**. Reused ranges produce 64 chapter-level
references. The source is pinned to commit
`724edf9bde9d356724ad384a2e196edc3c9f80f7` (`REL_18_6`).

Every referenced file was fetched from that immutable upstream commit. Each
named symbol was checked within its recorded line range, and each range was
checked against file length. Selected code conditions were read, including the
visibility-map fallback to a heap fetch and deferred-trigger firing. These are
verified implementation entry points and selected conditions, **not a complete
audit of all code paths**.

The implementation links supplement the primary documentation. They do not
claim that one function contains the entire explanation of its chapter.

## Native behavioral checks

The integration run reported **15 passing native PostgreSQL checks** using the
disposable pinned image configured in
[native_postgres.py](../tests/native_postgres.py):

`postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`

The checks cover transaction atomicity and savepoints; lazy XID allocation;
Read Committed and Repeatable Read snapshots; concurrent UPDATE predicate
rechecks; NOWAIT, SKIP LOCKED and deadlocks; Serializable write skew; JOIN
multiplicity, outer NULL behavior and EXISTS; the six built-in index methods;
visibility maps and index-only heap fetches; row and statement triggers;
EXPLAIN ANALYZE and the three join algorithms; physical streaming replication,
read-only standby and `remote_apply`; old-snapshot cleanup; logical-replication
local writes and conflicts; view triggers and deferred constraint triggers.

The test cluster uses no host database or credentials, no database bind mount
and no published port, and is removed after the run. These checks establish
selected server behaviors; they do not simulate a hardware power failure or
certify a production failover deployment. The link audit did not rerun them.

## Player and browser checks

The player verification run passed **87 Postgres tests** and
**145 passing Redis regression tests**. Real-browser coverage reported:

- 1,600 scene variants across languages and layouts;
- 21,634 text elements;
- 1,704 message routes;
- 70 animated transitions;
- zero reported geometry, routing or animation failures.

The chapter-card addition was checked separately in the actual player:
desktop and compact layouts, RU/EN switching, returning to the preceding
result, reduced motion and controls locked during the finite fade. Eight
navigation tests cover the full 400-stop cycle and all 70 chapter boundaries.

The browser checks verify rendering and finite playback behavior. Native
checks verify selected PostgreSQL semantics. Source-link checks verify source
availability and section targets. These evidence layers answer different
questions and are recorded separately.
