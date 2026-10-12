---
type: Open Question
title: "Q004 — How do we know a comment says nothing false?"
description: The engine's verdict is reliable but the model's wording was not checked; a code check now discards unsupported claims that a piece on a named square is free, while other false statements remain unchecked. Partial.
tags: [open-question, commentary, accuracy, llm, Q004]
question_id: Q004
status: Partial
date_opened: 2026-10-10
closed_by: code check in build 2026-10-12.2
generated: { by: human:jason-roche, at: 2026-10-12T00:00:00Z }
---

# Status

**Partial.** Opened 2026-10-10. Partly answered 2026-10-12.

**Answered:** one kind of false claim is now checked automatically. A move
comment with a sentence that names a square, on its own ("on c5") or inside
move notation ("Nxe4"), and calls something free,
hanging, hung, loose, unprotected, undefended, unguarded or "for nothing" is
discarded when the facts sent to the model support none of those words; the
note keeps its engine-only text and says the comment was discarded. The check
first landed in build `2026-10-11.2` (commit `6d7371e`), where any use of
those words counted. After review it was narrowed in build `2026-10-12.1` to
sentences that name a square, because the first version would also have
discarded true comments whose closing habit used such words as general advice
("keep scanning for loose pieces"). In build `2026-10-12.2` the square pattern
was widened to count squares inside move notation as well as standing alone.
The system prompt also forbids those words unless the facts say so. See [architecture](/architecture.md#answer-marker-and-length-cap) for how
the check works. Tested with stand-in replies, including a missed queen
capture answered "a free queen", which was discarded; in a real game on
2026-10-12 the visible comments were consistent with the engine's facts.

**Still open:**

- The check reads the facts as a whole, not per piece, so a wrong "free"
  passes when another piece in the same position really is undefended.
- A false claim written without naming a square ("you left your knight
  hanging") is not caught.
- The 4. e3 position that showed the c5 pawn gremlin did not reproduce as a
  flagged move in testing, so that exact case is untested.
- Other kinds of false statement are not checked: an invented reason, a wrong
  standing, or a square or move that is not in the facts.
- Game reviews are not checked at all.

# Context

As this question was opened on 2026-10-10:

Under [D002](/decisions/D002-engine-judges-llm-explains.md) the engine's
verdict is reliable, but the model's wording is not checked. Three false
statements were found by hand in play:

- a defended pawn called unprotected;
- the player called ahead when losing;
- an invented reason ("weakening your pawn structure") for a move where the
  engine gave none.

Each was fixed by changing the facts sent to the model, but nothing checks the
comment that comes back. The reply is only cut to its answer line and length
(see [architecture](/architecture.md)).

A fourth was found on 2026-10-11: a comment on 4. e3 called a pawn on c5
"free" when it was defended twice. It led to the claim check described under
Status.

# What would close it

An automated check on the reply — for example, rejecting a comment that names a
square or move not in the facts — or a decision that hand review is enough.
The claim check covers one kind of claim; closing the question needs either
checks for the rest, or a decision that the residual is acceptable.

# Related

- [D002](/decisions/D002-engine-judges-llm-explains.md) — the model only
  explains, so anything it adds is a defect.
- [D006](/decisions/D006-commentary-provider-local-omlx-default.md) — the
  providers whose replies would be checked.
- [Architecture](/architecture.md) — how replies are handled now, including
  the claim check.
