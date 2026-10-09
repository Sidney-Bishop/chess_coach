# AGENTS.md

Instructions for AI coding agents (Claude, Codex, OpenCode, Cursor, …) working
in **chess_coach**. Kept deliberately lean: bloated instruction files get
ignored wholesale rather than filtered. This file *points at* the docs instead
of restating them.

## What this is

TODO: one-line description.

## Build / test / run

```bash
uv sync          # install dependencies
uv run pytest    # run the test suite
```

## Using the knowledge bundle (`knowledge/`)

`knowledge/` is an OKF v0.1 bundle and the **current source of truth** for this
project's durable knowledge. Read it in two steps:

1. Read `knowledge/index.md`. It is short by design and lists every concept with
   a one-line description of what it is *for*.
2. Identify the **one or two** concepts whose descriptions match the task, and
   read only those.

**Do not bulk-read the bundle.** Loading every concept defeats the point — the
index exists so that context is spent on the concepts that matter. If the index's
descriptions don't tell you which concept you need, that's a bug in the index
worth fixing, not a reason to read everything.

Where things are:

- `knowledge/overview.md` — what this project is, its current state, what to read next.
- `knowledge/decisions/` — the D-ID log: why the code is the way it is. Start at its `index.md`.
- `knowledge/open-questions/` — the Q-ID log: what's genuinely unresolved.
- `knowledge/architecture.md` — the current structure and moving parts.
- `knowledge/pitfalls.md` — constraints that fail quietly when broken.
- `knowledge/conventions.md` — how to add to the bundle without breaking it, and how work is done here.
- `docs/journal.md` — the running session narrative. **Not** in the bundle, and
  authoritative for anything the bundle doesn't hold. **Append-only**; never edit
  old entries.

## Conventions

- Source lives in `src/`; exploratory work (if any) in `notebooks/`.
- **Significant choices become D-ID concepts** in `knowledge/decisions/`, one file
  each, named `D<NNN>-<slug>.md` with the slug frozen at creation. Never edit a
  decision to change it — write a new D-ID that supersedes it.
- **Open questions become Q-ID concepts** in `knowledge/open-questions/`, same
  filename rule. Questions resolve *into* decisions.
- `docs/decisions.md` and `docs/open_questions.md` are **signposts, not logs** —
  do not append records to them.
- Update the concept's area index (and `knowledge/log.md`) in the **same commit**
  as the concept itself. A stale index misleads every later reader.
- When you finish a working session, append a dated entry to `docs/journal.md`.
- Read `knowledge/conventions.md` before authoring your first concept — it
  specifies the frontmatter fields, supersession shapes and closure shapes.

## Guardrails

- Treat history as append-mostly: edits that delete large chunks are a red flag
  — show the diff before applying.
- Don't run destructive commands (data deletion, force-push) without asking.
