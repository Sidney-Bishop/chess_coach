# Decisions — chess_coach

The D-ID decision log: what was chosen, and why, preserved as historical records
with live statuses. Decisions are **never edited in place** — a superseded
decision keeps its original file and slug, and a new D-ID references it. The
*path* of decisions is itself information: "we chose A, then replaced it with B
because we discovered C" tells a future reader far more than a log showing only B.

Each concept is one file, named `D<NNN>-<slug>.md`, with the slug frozen at
creation. Supersession and status live in machine-routable frontmatter; the
reasoning lives in prose. See [conventions](/conventions.md) for the exact shapes,
and [D001](/decisions/D001-scaffolded-with-project-bootstrap.md) for the worked
example every new decision should follow.

Each bullet below ends in the decision's current status.

# Decisions

* [D001 — Scaffolded with project-bootstrap](/decisions/D001-scaffolded-with-project-bootstrap.md) - Adopt the standard layout — knowledge bundle, single-purpose docs, `src/` package, uv, and the enabled tooling options — rather than assembling the project by hand. **Active.**

# Supersession chains

* **Standalone (supersede nothing, superseded by nothing):** [D001](/decisions/D001-scaffolded-with-project-bootstrap.md).

_As chains form, record them here: `D002 → D005 → D009`, with a line saying what
each step changed and whether any earlier decision stays live in a narrower
scope. A scoped supersession (`DNNN (scoped: <scope>)`) means the old decision
still governs everything outside that scope — say so explicitly._

# Related

* [Overview](/overview.md) — what this project is.
* [Open questions](/open-questions/) — where decisions come from; questions
  resolve *into* decisions.
* [Conventions](/conventions.md) — the D-ID frontmatter and supersession shapes.
