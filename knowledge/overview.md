---
type: Overview
title: "chess_coach — Project Overview"
description: Orientation for chess_coach — what it is, what it is deliberately not, the current state, and where to read next.
tags: [orientation, overview]
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
stale_after: 2027-01-07T00:00:00Z
---

The orientation layer for chess_coach. This is the map; the concepts it
links to are the territory. Keep it short — when a section here starts growing
its own detail, that detail wants to be its own concept.

# What this project is

TODO: one-line description.

_TODO: Two or three sentences beyond the one-liner above. The concrete artefact,
the behaviour it produces, the input it operates on. Then the constraint that
shapes everything — the deadline, the audience, the limitation that, if it
changed, would change the whole shape of the project._

# What this project is not

_TODO: Explicit non-goals. The things a reader might reasonably assume this
project does, that it deliberately doesn't, and why. This section earns its keep
the first time it stops someone building the wrong thing._

# The stack (as of 2026-10-09)

| Aspect | Value |
|---|---|
| Language / runtime | Python (see `pyproject.toml` for the pinned version) |
| Environment | uv |
| Package | `src/chess_coach/` |
| Tests | _TODO: none yet / pytest under `tests/`_ |
| External services | _TODO: none / name them_ |

Version-sensitive values carry an **as-of date** and are verified against the
code or the binary, never carried forward from prose — see
[conventions](/conventions.md) and the doc-drift invariant in
[pitfalls](/pitfalls.md).

# Current state (as of 2026-10-09)

- **Scaffolded 2026-10-09** by project-bootstrap. Structure and environment are in
  place; no substantive work has happened yet.
- **Decisions:** one — [D001](/decisions/D001-scaffolded-with-project-bootstrap.md),
  the choice to start from the standard scaffold.
- **Open questions:** none opened yet.

_Keep this section current. It is the first thing a returning reader checks, and
a stale "current state" is worse than none. Dated changes go in [the log](/log.md);
the running session narrative goes in `docs/journal.md`._

# Conventions

Work here follows a **state-vs-history split**: state is overwritten as reality
changes, history is append-only and superseded rather than edited. Decisions are
numbered `DNNN` and questions `QNNN`, each one file, each keeping its slug
forever.

The full rules — type vocabulary, filename identity, supersession and closure
shapes, the as-of-date rule, and how collaboration is done here — are in
[conventions](/conventions.md).

# Where to read next

- [Decisions](/decisions/) — the *why* behind every choice that would otherwise
  look arbitrary six months from now.
- [Open questions](/open-questions/) — what is genuinely unresolved.
- [Architecture](/architecture.md) — how the system is put together right now.
- [Pitfalls](/pitfalls.md) — the constraints that fail quietly if broken.
- [Conventions](/conventions.md) — how to add to this bundle without breaking it.
- `docs/journal.md` — the session-by-session road. Not in this bundle, and
  **authoritative** for anything the bundle doesn't hold.

# Reading order for a fresh start

If you are picking this project up with no context, or resuming after a
compaction: read the root [index](/index.md), then this overview, then the one or
two concepts whose descriptions match your task. Then the tail of
`docs/journal.md` for what happened most recently. That is enough to work; read
further only when a specific question demands it.
