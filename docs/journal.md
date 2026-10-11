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

## 2026-10-10 — playable board, coaching, and the move to a local page and model

Covers the work since the 2026-10-09 entry; the first three commits below
landed late on 2026-10-09, the last on 2026-10-10.

- First playable board committed at `b048719`: `web/chess_coach.html`, with
  Stockfish 10 (asm.js build) and chess.js 0.10.3 vendored under `web/vendor/`.
- Move-by-move coaching, an end-of-game review and a Resign button committed at
  `6e466ea`, with the logic moved into `web/coach.js`. It first ran as a
  published Claude artifact calling cloud Claude.
- Recorded D005 (page served locally; artifact an optional cloud build) and
  D006 (local-omlx commentary by default) at `69de420`, superseding D003.
- Local page and local-omlx provider committed at `6cc7461`.
  `web/chess_coach.html` was removed in favour of `web/index.html`, a complete
  HTML document; `scripts/make_artifact.py` derives the artifact form from it.
  `web/config.js` holds the local provider's settings.
- Gremlins, each a real failure found in play:
  1. The first cloud calls failed silently: the code hid the errors, and it
     used the JSON form of the call.
  2. A move that ended the game by stalemate was not judged at all.
  3. Claude called a defended pawn unprotected, because it was given every
     legal capture with no indication of which were good.
  4. Claude said the player was ahead when they were losing, because it was
     given the material gained, not the overall standing.
  5. The local model's reasoning was shown as the comment. It reasoned in plain
     text with no think tags and ran into the token limit. Fixed by requiring
     the answer on a `COMMENT:` line, discarding replies without one, and
     capping the length in code.
  6. A fix reported as delivered to the repo was not: the file copy delivered a
     stale version. Caught by checking the file on disk. A visible build number
     was added to the page so a stale copy shows.
  7. An even trade was labelled a hung piece.
- Current state: build `2026-10-10.4`. Comments from Ornith run to one or two
  sentences. Thresholds: mistake at 200 centipawns lost, blunder at 400, and no
  flag when the player is still 500 or more ahead after the move.
- Next: seed the open-questions backlog.
- Done the same day: opened Q001–Q005 in `knowledge/open-questions/`: level-1 opponent strength,
  flag thresholds, coaching opening principles, checking comments for false
  statements, and remembering patterns across games.

## 2026-10-11 — release 1.0.0, branching model, and the coach's voice

- Version 1.0.0 tagged `v1.0.0` at `1d86b6f` and pushed to the private GitHub
  repo, `Sidney-Bishop/chess_coach`.
- `develop` created as the integration branch.
- Spoken coach comments built on `feature/coach-voice` and committed at
  `1bbd3e1`: the browser's own speech synthesis, off until "Speak comments" is
  ticked, with chess notation turned into words in code.
- Before the player heard it, the speech was tested only with a stand-in that
  recorded the words passed to it, not with a real voice.
- The player confirmed by ear on 2026-10-10 that it works well.
- Recorded D007 (comments spoken with the browser's speech synthesis) and D008
  (main for releases, develop for integration, feature branches off develop).
- Next: merge `feature/coach-voice` into `develop` and release as 1.1.0.

<!-- Entry shape:

## YYYY-MM-DD — short summary of the session

- What you actually did.
- What broke and how you diagnosed it.
- Dead ends — what you tried that didn't work, and why you abandoned it.
- Wrong conclusions you reached and later corrected (these are gold).
- Gremlins — the environment bug, the tooling quirk, the thing that confused
  you twice.
-->
