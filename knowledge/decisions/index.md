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
* [D002 — Engine judges, LLM explains](/decisions/D002-engine-judges-llm-explains.md) - Stockfish in the page determines move quality; the LLM only turns the engine's output into plain-language coaching and never evaluates positions itself. **Active.**
* [D003 — Repo is the source of truth; the playable page runs as a published Claude artifact](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md) - The HTML/JS lives in this repo and is published as a Claude artifact so the page can call Claude without an API key or local model server. **Superseded by [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md).**
* [D004 — Coaching is pitched at a 500-600 rated player](/decisions/D004-coaching-pitched-at-500-600-player.md) - Commentary covers hung pieces, missed captures, opening principles and simple tactics, speaks only when instructive, and ends with a summary of recurring patterns. **Active.**
* [D005 — The page runs served locally; the published artifact is an optional cloud build](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) - The page's primary home is `web/` served locally over HTTP so it can reach a local model server; the published artifact is an optional cloud build derived from `web/index.html`. Supersedes D003. **Active.**
* [D006 — Commentary provider is local-omlx by default; cloud-claude only in the artifact, with no automatic fallback](/decisions/D006-commentary-provider-local-omlx-default.md) - The local page gets commentary from local models via oMLX; cloud Claude is used only by the artifact, and the page never switches provider. **Active.**
* [D007 — The coach's comments are spoken with the browser's built-in speech synthesis](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md) - Comments and the review are read aloud by the browser's own speech synthesis, off until the player opts in, with chess notation turned into words in code. **Active.**
* [D008 — Branching and release model: main for releases, develop for integration, feature branches off develop](/decisions/D008-branching-main-releases-develop-integration.md) - `main` receives only tagged releases, `develop` integrates, each feature is built on `feature/<name>` off `develop`, and the artifact is republished only at a release. **Active.**

# Supersession chains

* **[D003](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md) → [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md)** — where the playable page runs. D003 made the published Claude artifact the page's home; D005 moves the primary home to `web/` served locally, because the artifact's content-security policy blocks fetches to a local model server, and keeps the artifact only as an optional cloud build. Whole supersession: D003 governs nothing now, and its "repo is the source of truth" point carries forward as D005's first point.
* **Standalone (supersede nothing, superseded by nothing):** [D001](/decisions/D001-scaffolded-with-project-bootstrap.md), [D002](/decisions/D002-engine-judges-llm-explains.md), [D004](/decisions/D004-coaching-pitched-at-500-600-player.md), [D006](/decisions/D006-commentary-provider-local-omlx-default.md),
  [D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md),
  [D008](/decisions/D008-branching-main-releases-develop-integration.md).

_As chains form, record them here: `D002 → D005 → D009`, with a line saying what
each step changed and whether any earlier decision stays live in a narrower
scope. A scoped supersession (`DNNN (scoped: <scope>)`) means the old decision
still governs everything outside that scope — say so explicitly._

# Related

* [Overview](/overview.md) — what this project is.
* [Open questions](/open-questions/) — where decisions come from; questions
  resolve *into* decisions.
* [Conventions](/conventions.md) — the D-ID frontmatter and supersession shapes.
