# Decisions — see `knowledge/decisions/`

**This file is a signpost, not a log. Do not append decisions here.**

chess_coach records decisions as **concepts in the knowledge bundle**, one
file per decision:

    knowledge/decisions/D<NNN>-<slug>.md

To find a decision, start at `knowledge/index.md`, then open
`knowledge/decisions/index.md` — it lists every D-ID with a one-line summary, its
current status, and the supersession chains.

To add one:

1. Pick the next `D<NNN>` (zero-padded) and a slug that will still be accurate
   in a year — **the slug is frozen at creation and the file is never renamed**.
2. Copy the shape of `knowledge/decisions/D001-scaffolded-with-project-bootstrap.md`.
3. Add its bullet to `knowledge/decisions/index.md` and a line to
   `knowledge/log.md`, in the same commit.

The frontmatter fields and supersession shapes are specified in
`knowledge/conventions.md`.

---

*Why this file exists at all:* `docs/decisions.md` is a near-universal
convention, and a tool or agent asked to "log a decision" that finds nothing here
is liable to create one — forking the record in two places. This signpost points
the way instead. It holds no facts, so it cannot go stale except in its pointer.
