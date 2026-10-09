---
type: Decision
title: "D002 — Engine judges, LLM explains"
description: Move quality comes from Stockfish running in the page; the LLM never evaluates positions and only turns the engine's output into plain-language coaching.
tags: [decision, engine, llm, coaching, D002]
decision_id: D002
status: Active
date: 2026-10-09
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-09. Supersedes: none. Superseded by: none.

# Context

chess_coach is a chess tutor: an HTML chess game where the player gets coaching
on their moves as they play. Coaching needs two things — a judgement of whether
a move was good or bad, and an explanation a person can learn from. Those can
come from different places, and the choice of which component supplies which
determines whether the advice can be trusted.

# Decision

Split the two jobs:

1. **A real chess engine judges.** Move quality is determined by Stockfish
   running in the page.
2. **The LLM explains.** It never evaluates positions itself. It receives the
   engine's output — the position, the move played, the engine's preferred
   move, and the evaluation change — and turns that into plain-language
   coaching.

# Rationale

- **LLMs are unreliable at calculating chess positions.** A tutor that
  confidently gives wrong advice is worse than no tutor, because the player has
  no way to tell the wrong advice from the right.
- **Engines alone give numbers without reasons.** An evaluation swing tells the
  player *that* a move was bad, not *why*, which is the part they need in order
  to improve.
- Pairing them puts each component on the job it is reliable at: the engine
  supplies the ground truth, the LLM supplies the explanation.

# Trade-offs / risks

- The LLM can still mis-explain a correct engine verdict — inventing a reason
  that does not match the engine's line. The split bounds *what* it can get
  wrong (the explanation, not the verdict) but does not eliminate error.
- Running Stockfish in the page ties coaching quality to what the browser can
  compute in reasonable time; shallow searches may misjudge some positions.

# When to revisit

- If the LLM's explanations routinely contradict the engine's line, the input it
  receives is too thin — revisit what engine output is passed to it.
- If an LLM becomes reliably accurate at position evaluation, the split may no
  longer be needed — record that as a new decision rather than editing this one.

# Related

- [D003](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md) — how the
  page reaches the LLM that does the explaining.
- [D004](/decisions/D004-coaching-pitched-at-500-600-player.md) — what the
  explanations focus on, and when the tutor speaks at all.
- [Architecture](/architecture.md) — where the engine and LLM sit in the page.
