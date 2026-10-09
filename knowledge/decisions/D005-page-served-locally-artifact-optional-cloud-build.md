---
type: Decision
title: "D005 — The page runs served locally; the published artifact is an optional cloud build"
description: The playable page's primary home is web/ served locally over HTTP so it can reach a local model server; the published Claude artifact remains only as an optional cloud-hosted build derived from web/index.html.
tags: [decision, deployment, artifact, local-server, D005]
decision_id: D005
status: Active
date: 2026-10-09
supersedes: D003
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-09. Supersedes: [D003](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md). Superseded by: none.

D003 was Provisional. Its validation event was partly met — live commentary by
Claude worked in the artifact during play on 2026-10-09 — but the artifact
cannot reach a local model server, which the project now wants by default (see
[D006](/decisions/D006-commentary-provider-local-omlx-default.md)). This
decision replaces D003 whole. D003's first point, that the repo is the source
of truth, carries forward unchanged as point 1 below.

# Context

[D003](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md) had the
playable page running as a published Claude artifact so it could call Claude
without an API key. That worked: live commentary by Claude ran in the artifact
during play on 2026-10-09.

But a published artifact's content-security policy blocks every fetch except to
files published with the page. It therefore cannot reach a model server on the
player's own machine, in any browser.

# Decision

1. **The repo stays the source of truth.**
2. **The page's primary home is the repo's `web/` directory served locally over
   HTTP** — `python3 -m http.server` run in `web/`, opened at
   `http://localhost:<port>/` — not `file://`, because Chrome will not start
   the Stockfish Web Worker from a `file://` page.
3. **`web/index.html` becomes a complete HTML document.** The artifact's
   fragment form is derived from it at publish time.
4. **The published artifact remains as an optional cloud-hosted build.**

# Rationale

- **The project wants commentary from a local model by default** (see
  [D006](/decisions/D006-commentary-provider-local-omlx-default.md)), and only
  a locally served page can reach it. The artifact's content-security policy
  rules it out as the primary home.
- **Serving over HTTP rather than opening the file** is what lets the Stockfish
  Web Worker start in Chrome.

# Trade-offs / risks

- The page now needs a local server running to be used in its primary form.
- Two forms of the page exist. The artifact can drift from the repo if it is
  not regenerated from `web/index.html` at each publish.

# When to revisit

- If the artifact runtime's content-security policy changes to allow fetches to
  local or user-configured endpoints.
- If running a local server becomes the main obstacle to playing daily.

# Related

- [D003](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md) — the
  decision this supersedes.
- [D006](/decisions/D006-commentary-provider-local-omlx-default.md) — the
  commentary provider that requires a locally served page.
- [D002](/decisions/D002-engine-judges-llm-explains.md) — why the page needs an
  LLM at all.
- [Architecture](/architecture.md) — how the page is built and served.
