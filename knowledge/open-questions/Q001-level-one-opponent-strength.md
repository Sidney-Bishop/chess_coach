---
type: Open Question
title: "Q001 — How strong should the level-1 opponent be for a 500-600 rated player?"
description: Level 1's strength against a 500-600 player has never been measured, and early games suggest it is too weak or too erratic; what should it be? Open.
tags: [open-question, opponent, engine, levels, Q001]
question_id: Q001
status: Open
date_opened: 2026-10-10
generated: { by: human:jason-roche, at: 2026-10-10T00:00:00Z }
---

# Status

**Open.** Opened 2026-10-10.

# Context

As of 2026-10-10, level 1 is Stockfish skill 0 at depth 1, with a 35 percent
chance of playing a random legal move instead (`LEVELS` in `web/coach.js`; see
[architecture](/architecture.md)). Its strength against a 500-600 rated player
([D004](/decisions/D004-coaching-pitched-at-500-600-player.md)) has never been
measured.

In games on 2026-10-09 and 2026-10-10 the player reached evaluations of +11 to
+18 by the middlegame. That suggests level 1 is too weak or too erratic, but it
rests on a handful of games.

# What would close it

A level whose results against the player are roughly even over a run of games,
or a decision on what "right" means here.

# Related

- [D004](/decisions/D004-coaching-pitched-at-500-600-player.md) — the player
  the opponent is pitched at.
- [Architecture](/architecture.md) — the opponent levels as built.
