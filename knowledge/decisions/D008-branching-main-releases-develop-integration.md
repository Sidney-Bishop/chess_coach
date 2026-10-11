---
type: Decision
title: "D008 — Branching and release model: main for releases, develop for integration, feature branches off develop"
description: main receives only tagged releases, develop is the integration branch, each feature is built on feature/<name> off develop, and the published artifact is republished only at a release.
tags: [decision, git, branching, release, D008]
decision_id: D008
status: Active
date: 2026-10-11
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-11T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-11. Supersedes: none. Superseded by: none.

# Context

Version 1.0.0 was tagged `v1.0.0` on 2026-10-10 at commit `1d86b6f` and pushed
to a private GitHub repository, `Sidney-Bishop/chess_coach`.

The repository is private because Stockfish is vendored under the GPL
(GPL-3.0, per `web/vendor/VENDORED.txt` as of 2026-10-11), which carries
obligations if the code is made public.

# Decision

1. **`main` only receives releases**, each tagged `vMAJOR.MINOR.PATCH`, with the
   same version in `pyproject.toml`.
2. **`develop` is the integration branch.**
3. **Each feature is built on a branch named `feature/<name>`** off `develop`
   and merged back into `develop`.
4. **A release merges `develop` into `main`** and tags it.
5. **The published artifact is the cloud build of `main`**, republished only at
   a release.

# Rationale

- `main` stays a known-good version while work continues.

# Trade-offs / risks

- More ceremony than committing to `main`, for a one-person project.

# When to revisit

- If the ceremony outweighs the benefit of a known-good `main`.
- If the repository is to be made public — the GPL obligations from the
  vendored Stockfish must be met first.

# Related

- [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) —
  the published artifact as an optional cloud build.
- [D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md) —
  the first feature built under this model.
- [Architecture](/architecture.md) — the vendored files and the artifact form.
