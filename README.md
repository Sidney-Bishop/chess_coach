# chess_coach

TODO: one-line description.

## Quickstart

```bash
uv sync          # set up the environment
uv run pytest    # run tests (if present)
```

## Documentation map

Durable knowledge lives in **`knowledge/`**, an OKF v0.1 bundle: a short root
index plus one file per concept. Read it in two steps — `knowledge/index.md`
first, then the one or two concepts whose descriptions match what you need. The
index says what each concept is *for*; it deliberately doesn't summarise
contents, because a summary there would rot.

| Location                        | Kind             | Read it for…                        | Update style           |
|---------------------------------|------------------|-------------------------------------|------------------------|
| `knowledge/index.md`            | Index            | **Start here.** What exists, and where | Update with concepts|
| `knowledge/overview.md`         | State            | What this is; current state          | Overwrite              |
| `knowledge/architecture.md`     | State            | How it's built right now             | Overwrite              |
| `knowledge/decisions/`          | Decision history | What we chose and why (D-IDs)        | New file + supersede   |
| `knowledge/open-questions/`     | State + history  | What we don't know yet (Q-IDs)       | New file; close, don't delete |
| `knowledge/pitfalls.md`         | Invariants       | What fails quietly when broken       | Append entries         |
| `knowledge/conventions.md`      | Reference        | How to add to the bundle; how we work| Overwrite              |
| `knowledge/log.md`              | History          | What changed in the knowledge, dated | Append-only            |
| `docs/journal.md`               | Session history  | The road: what happened, what broke  | Append-only, dated     |
| `docs/backlog.md`               | Fluid            | What might come next                 | Cross off when done    |
| `docs/philosophy.md`            | Guide            | *Why* it's structured this way       | Teaches; rarely edited |

`docs/decisions.md` and `docs/open_questions.md` are **signposts** pointing into
the bundle — they hold no records. Don't append to them.

**Routing rule** — where does a sentence go? `true now` → `overview.md` or
`architecture.md` · `a choice someone will later question` → a new D-ID concept ·
`something we don't know yet` → a new Q-ID concept · `something that happened` →
`docs/journal.md` · `a constraint that fails quietly` → `pitfalls.md`.

## Layout

```
chess_coach/
├── src/            # the importable package
├── tests/          # pytest (if enabled)
├── docs/           # the single-purpose docs above
└── data/           # DVC-tracked inputs/outputs (if enabled)
```

## License

MIT · TODO
