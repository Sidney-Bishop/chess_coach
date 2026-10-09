---
type: Decision
title: "D001 — Scaffolded with project-bootstrap"
description: Start chess_coach from the project-bootstrap standard — knowledge bundle, single-purpose docs, src/ package, uv — rather than assembling the recurring plumbing by hand.
tags: [decision, scaffold, conventions, D001]
decision_id: D001
status: Active
date: 2026-10-09
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
---

> **This is the worked example.** Every later decision in this bundle follows
> this shape: the frontmatter above (machine-routable status and supersession)
> and the sections below (the reasoning, in prose). Copy the shape, not the
> content. See [conventions](/conventions.md) for the field rules.

# Status

**Active.** Date: 2026-10-09. Supersedes: none. Superseded by: none.

# Context

chess_coach was started on 2026-10-09. Every project of this kind needs the
same plumbing before any real work can begin: a package layout that imports
cleanly, a managed environment, a place to record decisions, a place to record
what happened, and instructions an AI coding agent can actually follow. Assembling
that from memory each time is slow and produces a slightly different result every
time — which means no two projects can share tooling, conventions, or muscle
memory.

# Decision

Start from the project-bootstrap standard rather than by hand. Concretely:

1. **An OKF v0.1 knowledge bundle at `knowledge/`** as the project's durable
   knowledge surface. D-IDs and Q-IDs are born here as individual concepts, each
   one file with a frozen slug, reachable through the root
   [index](/index.md) by a two-step read: index first, then the one or two
   concepts whose descriptions match the task.
2. **`src/` layout** with the packaging configuration that makes `import
   chess_coach` work from tests, and **uv** for the environment.
3. **The session journal stays outside the bundle.** `docs/journal.md` is
   append-only narrative and remains authoritative for session-level detail.
4. **Whatever tooling options were enabled at scaffold time** — tests, git, and
   the optional tiers (data control, knowledge graph, publication, agent
   instruction files) as selected.

# Rationale

- **Recurring plumbing is error-prone to reassemble.** Starting from a considered
  baseline means the documentation discipline is in place from commit one, rather
  than being retrofitted after the project is already hard to describe.
- **The bundle exists to make knowledge *retrievable*, not merely written down.**
  A single large document has to be read whole to be used at all; concepts with
  descriptions can be routed to. That difference is what makes the knowledge
  survive contact with a fresh reader — human or agent — who has no context.
- **One concept per file keeps the blast radius of every edit small**, and makes
  supersession an append rather than an edit to a historical record.
- **Consistency across projects compounds.** The same shape everywhere means
  conventions, tooling, and habits transfer.

# Trade-offs / risks

- The scaffold includes structure this project may never grow into. **Prune what
  you don't use rather than letting it rot** — an unused, unmaintained concept is
  worse than an absent one, because the index promises it means something.
- The bundle has a real maintenance cost the flat-file alternative does not: each
  new concept needs an index entry and, when it changes something, a
  [log](/log.md) entry. That cost is small per concept and constant; the payoff
  grows with the number of concepts. Early on it will feel like overhead.
- An index that lags its concepts is the failure mode to watch. It is the file
  every reader loads first, so its staleness propagates further than any other
  file's.

# When to revisit

- If the standard itself changes materially, decide whether this project should
  be re-aligned — and record that as a new decision rather than editing this one.
- If the bundle is still holding only two or three concepts after months of real
  work, the maintenance cost is not being repaid: either the knowledge is going
  somewhere else (find out where), or this project is small enough that the flat
  `docs/` set would have been the better fit.

# Related

- [Overview](/overview.md) — what this project is.
- [Conventions](/conventions.md) — the rules this decision commits the project to.
- [The log](/log.md) — the bundle's creation entry, dated 2026-10-09.
