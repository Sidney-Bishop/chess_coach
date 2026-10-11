---
type: Decision
title: "D007 — The coach's comments are spoken with the browser's built-in speech synthesis"
description: Coach comments and the game review are read aloud by the browser's own speech synthesis, off until the player opts in, with chess notation turned into words in code; an open-source speech model run locally was considered and not built.
tags: [decision, voice, speech, web, D007]
decision_id: D007
status: Active
date: 2026-10-11
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-11T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-11. Supersedes: none. Superseded by: none.

# Context

The player wanted the coach's text spoken aloud, using a free or open-source
service.

# Decision

1. **Speech uses the browser's built-in speech synthesis**, with whatever
   voices the browser offers. The project runs no speech server, and there is
   no model download and no account.
2. **Speaking is off until the player ticks "Speak comments".** The choice, the
   voice and the speed are remembered in browser storage.
3. **When speech happens.** A new comment is spoken once, when its final text
   arrives, prefixed with its verdict. A game review written by the model is
   spoken when it arrives. Each comment and the game review have a replay
   button. A new utterance cuts off one still being spoken, and starting a new
   game, taking back a move or resigning stops speech.
4. **Chess notation is turned into words in code** before it reaches the voice —
   for example "Nxe4+" becomes "knight takes E 4, check" — covering castling,
   pawn captures, promotion, check and checkmate.
5. **The voice list offers the browser's English voices**, falling back to all
   voices if there are none. Voices the browser marks as local to the machine
   are listed first. Chrome also offers network voices, and these are in the
   list too.

# Rationale

- It is free and needed no new infrastructure. With a voice local to the
  machine, speech is produced on the player's machine.
- The player listened to it on 2026-10-10 and judged it good enough.

**Alternative considered and not built:** an open-source speech model (Kokoro)
run as a local server. It is held as the next step only if the built-in voice
proves inadequate. Its packaging was not verified.

# Trade-offs / risks

- The built-in synthesis is free but not open source.
- Voice quality depends on what is installed on the machine.
- If the player picks one of the browser's network voices, the text of each
  comment is sent to that voice's provider to be spoken. The list does not yet
  mark which voices are local and which are network.
- It has not been tried in the published artifact.

# When to revisit

- If the built-in voice proves inadequate — then try Kokoro as a local server,
  verifying its packaging first.
- When the voice is first tried in the published artifact.

# Related

- [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) —
  the locally served page and the artifact the voice has not yet been tried in.
- [D006](/decisions/D006-commentary-provider-local-omlx-default.md) — the
  providers that write the comments being spoken.
- [Architecture](/architecture.md) — how the voice is built.
