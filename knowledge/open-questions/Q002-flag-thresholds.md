---
type: Open Question
title: "Q002 — Are the flag thresholds right?"
description: The mistake, blunder and still-ahead thresholds are first guesses; what values keep the coach quiet on ordinary moves? Open.
tags: [open-question, coaching, thresholds, Q002]
question_id: Q002
status: Open
date_opened: 2026-10-10
generated: { by: human:jason-roche, at: 2026-10-10T00:00:00Z }
---

# Status

**Open.** Opened 2026-10-10.

# Context

As of 2026-10-10, a move is flagged as a mistake at 200 centipawns lost and a
blunder at 400, and nothing is flagged when the player is still 500 or more
ahead after the move (`COACH` in `web/coach.js`; see
[architecture](/architecture.md)). All three are first guesses.

One 25-move game on 2026-10-10 produced eight flagged moves, before the
still-ahead rule existed.
[D004](/decisions/D004-coaching-pitched-at-500-600-player.md) says the coach
should stay quiet on ordinary moves.

# What would close it

Thresholds settled after reviewing how many moves are flagged per game across
several games, recorded as a decision.

# Related

- [D004](/decisions/D004-coaching-pitched-at-500-600-player.md) — the "stay
  quiet" rule the thresholds serve.
- [D002](/decisions/D002-engine-judges-llm-explains.md) — the engine's
  evaluation is what the thresholds are applied to.
- [Architecture](/architecture.md) — the judging flow as built.
