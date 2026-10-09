---
type: Decision
title: "D003 — Repo is the source of truth; the playable page runs as a published Claude artifact"
description: The HTML/JS source lives in this repo and the playable page is published from it as a Claude artifact, so it can call Claude for commentary without an API key or a local model server.
tags: [decision, deployment, artifact, llm, D003]
decision_id: D003
status: Superseded
date: 2026-10-09
supersedes: none
superseded_by: D005
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
---

# Status

**Superseded** by [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) on 2026-10-09. Date: 2026-10-09. Supersedes: none. Superseded by: D005.

Provisional until the validation event: **the first full game played end to end
with live commentary.** If that works, promote this decision to Active; if it
does not, record what broke and supersede it with a new decision.

# Context

The page needs to ask Claude for commentary during play (see
[D002](/decisions/D002-engine-judges-llm-explains.md): the LLM explains the
engine's verdicts). Where the page runs determines how — or whether — it can
reach an LLM at all.

# Decision

1. **The repo is the source of truth.** The HTML/JS source lives in this repo.
2. **The playable page runs as a published Claude artifact**, published from
   that source, so it can call Claude directly without an API key or a local
   model server.

# Rationale

- **A plain local HTML file has no way to reach an LLM without extra
  infrastructure** — an API key embedded or proxied somewhere, or a model
  server running locally. Publishing as a Claude artifact removes that
  infrastructure from the picture.
- **Keeping the source in the repo** means the code is versioned, reviewed and
  documented here, and the published artifact is a build output rather than the
  place the code lives.

# Trade-offs / risks

- The published artifact can drift from the repo if it is edited or republished
  from anywhere other than this source. The repo only stays the source of truth
  if every publish starts from it.
- The page depends on the artifact runtime's ability to call Claude; behaviour
  and limits there are outside this project's control.

# When to revisit

- At the validation event above — the first full game played end to end with
  live commentary.
- If the artifact runtime cannot support the commentary the tutor needs (latency,
  limits, or loading Stockfish in the page), revisit how the page reaches the LLM.

# Related

- [D002](/decisions/D002-engine-judges-llm-explains.md) — why the page needs an
  LLM at all.
- [Architecture](/architecture.md) — how the page is built and published.
