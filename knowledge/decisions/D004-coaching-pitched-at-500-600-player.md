---
type: Decision
title: "D004 — Coaching is pitched at a 500-600 rated player"
description: Commentary targets a beginner rated about 500-600 — hung pieces, missed captures, opening principles, simple tactics — speaking only when a move is instructive, with an end-of-game summary of recurring patterns.
tags: [decision, coaching, audience, D004]
decision_id: D004
status: Active
date: 2026-10-09
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-09. Supersedes: none. Superseded by: none.

# Context

The player is a beginner/casual player rated about 500-600 on chess.com
(as of 2026-10-09). Coaching that is accurate but pitched at the wrong level —
too advanced, or too frequent — does not help them improve.

# Decision

1. **Focus on what decides games at this level:** hung pieces, missed captures,
   basic opening principles, and simple tactics. Not positional plans or pawn
   structure.
2. **Stay quiet on ordinary moves.** The tutor speaks only when something is
   instructive.
3. **End each game with a summary of recurring patterns** — the mistakes that
   came up more than once.

# Rationale

- **At this level, games are decided by one-move oversights.** Positional
  commentary addresses problems the player does not yet have.
- **Commentary on every move becomes noise.** If the tutor always talks, the
  player learns to ignore it, including when it matters.
- The end-of-game summary turns individual moments into patterns the player can
  work on between games.

# Trade-offs / risks

- "Instructive" needs a working definition — some threshold on the engine's
  evaluation change (see [D002](/decisions/D002-engine-judges-llm-explains.md))
  plus the kinds of mistake listed above. Set too high, the tutor misses
  teachable moments; set too low, it becomes the noise this decision avoids.
- The player's rating will change. Pitching stays fixed at 500-600 until this
  decision is revisited.

# When to revisit

- When the player's rating rises materially above 600, or one-move oversights
  stop being what decides their games — record the new pitch as a new decision
  rather than editing this one.
- If the player finds the tutor too quiet or too chatty in real games.

# Related

- [D002](/decisions/D002-engine-judges-llm-explains.md) — the engine output the
  commentary is built from.
- [Overview](/overview.md) — who chess_coach is for.
