# Journal

The append-only, dated narrative of building this. **One entry per working
session.** Records the *road*, not just the destination: what you did, what
broke, the dead ends, the wrong turns you corrected, the small gremlins.

**Append-only.** Never edit an old entry to "fix" it — if it was wrong, write
a new entry correcting it. The wrongness is part of the record.

---

## 2026-10-09 — project scaffolded

- Created `chess_coach` from the project-bootstrap scaffolder.
- Layout, docs skeleton, and environment are in place; this is the seed entry
  so the journal is never an empty file pretending a record exists.
- First real work starts from here — log what you try, including what fails.

## 2026-10-09 — bootstrap fix-up and first design decisions

- Scaffolded with project-bootstrap using `--preset minimal --yes`.
- Gremlin: the bootstrap commit (`df12238`) left `publications/` untracked,
  because bootstrap commits before it writes that directory. Fixed here with a
  follow-up commit (`59f1792`). Recorded upstream in Project_Proto_Type's bundle
  as Q010 (commit `1549804` there).
- Recorded and committed three design decisions at `81e06f7`:
  - D002 — engine judges, LLM explains.
  - D003 — the repo is the source of truth; the page runs as a published Claude
    artifact. **Provisional** until the first full game played with live
    commentary.
  - D004 — coaching pitched at a 500-600 rated player.
- No application code exists yet.
- Next: build the first playable board page (legal moves, engine opponent), then
  add the commentary.

<!-- Entry shape:

## YYYY-MM-DD — short summary of the session

- What you actually did.
- What broke and how you diagnosed it.
- Dead ends — what you tried that didn't work, and why you abandoned it.
- Wrong conclusions you reached and later corrected (these are gold).
- Gremlins — the environment bug, the tooling quirk, the thing that confused
  you twice.
-->
