---
type: Open Question
title: "Q003 — How should opening principles be coached?"
description: D004 puts opening principles in scope, but breaking them rarely costs enough evaluation to cross a flag threshold, so they are never flagged; detect them in code or drop them? Open.
tags: [open-question, coaching, openings, scope, Q003]
question_id: Q003
status: Open
date_opened: 2026-10-10
generated: { by: human:jason-roche, at: 2026-10-10T00:00:00Z }
---

# Status

**Open.** Opened 2026-10-10.

# Context

[D004](/decisions/D004-coaching-pitched-at-500-600-player.md) lists basic
opening principles as something the coach covers. But the coach only speaks
when the engine's evaluation drops past a threshold (see
[Q002](/open-questions/Q002-flag-thresholds.md)), and moves that break opening
principles — moving the same piece twice, early queen moves, not castling —
usually cost far less than 200 centipawns. So they are never flagged.

# What would close it

A way to detect them in code that fits
[D002](/decisions/D002-engine-judges-llm-explains.md), or a decision to drop
them from D004's scope.

# Related

- [D004](/decisions/D004-coaching-pitched-at-500-600-player.md) — the scope
  that includes opening principles.
- [D002](/decisions/D002-engine-judges-llm-explains.md) — any detection must
  stay in code, not in the model.
- [Q002](/open-questions/Q002-flag-thresholds.md) — the thresholds these moves
  fall under.
