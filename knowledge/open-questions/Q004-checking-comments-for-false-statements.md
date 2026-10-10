---
type: Open Question
title: "Q004 — How do we know a comment says nothing false?"
description: The engine's verdict is reliable but the model's wording is not checked, and three false statements have been found by hand; should replies be checked automatically? Open.
tags: [open-question, commentary, accuracy, llm, Q004]
question_id: Q004
status: Open
date_opened: 2026-10-10
generated: { by: human:jason-roche, at: 2026-10-10T00:00:00Z }
---

# Status

**Open.** Opened 2026-10-10.

# Context

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

# What would close it

An automated check on the reply — for example, rejecting a comment that names a
square or move not in the facts — or a decision that hand review is enough.

# Related

- [D002](/decisions/D002-engine-judges-llm-explains.md) — the model only
  explains, so anything it adds is a defect.
- [D006](/decisions/D006-commentary-provider-local-omlx-default.md) — the
  providers whose replies would be checked.
- [Architecture](/architecture.md) — how replies are handled now.
