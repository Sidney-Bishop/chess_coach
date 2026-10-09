---
type: Reference
title: "chess_coach — Architecture"
description: How chess_coach is built right now — components, data flow, external services and configuration, and the non-obvious constraints that bite newcomers.
tags: [reference, architecture]
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
stale_after: 2027-01-07T00:00:00Z
---

How chess_coach is built **right now** — the moving parts, how they fit, the
key data flows, where things live, external services, and the non-obvious
constraints.

This is a **state** concept: overwrite it as the architecture changes. The
*reasons* the architecture is shaped this way live in [decisions](/decisions/);
the *story* of how it got there lives in `docs/journal.md`. This concept just
says what *is*.

# Components

- `src/chess_coach/` — the importable package.

_TODO: describe modules as they appear. One or two lines each: what it is
responsible for, what it depends on, what depends on it._

# Data flow

_TODO: how data moves through the system. A short ordered description of the
stages — what comes in, what goes out, where the code for each stage lives. If
there is no pipeline yet, say so rather than leaving this blank._

# External services & configuration

_TODO: APIs, environment variables, credentials, and what each controls. Name
the variable and its effect, not just its existence. If a variable can silently
change behaviour when unset, that is an invariant — record it in
[pitfalls](/pitfalls.md) too._

# Constraints worth knowing

_TODO: the non-obvious things that bite newcomers. Ordering requirements,
platform assumptions, resource ceilings, anything where the obvious approach is
wrong for a reason that isn't visible in the code._

# Related

- [Overview](/overview.md) — what the project is, above the level of its parts.
- [Decisions](/decisions/) — why the architecture is shaped this way.
- [Pitfalls](/pitfalls.md) — the constraints that fail quietly.
