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

## 2026-10-11 — release 1.1.0 and marking online voices

- Merged `feature/coach-voice` into `develop` at `4db490a`.
- Released 1.1.0: `main` at `64256f1`, tagged `v1.1.0`. The published artifact
  was republished from that source.
- D007 was corrected before it was committed: a comparison with the code found
  the voice list also includes the browser's network voices, not only voices
  installed on the machine.
- On `feature/voice-labels`, committed at `9d6e092`: the voice list now groups
  voices under "On this computer" and "Online: text is sent to the provider",
  and a warning line appears when an online voice is selected.
- The player's chosen voice turned out to be a local one.
- Gremlin: a comment on 4. e3 called a pawn on c5 "free" when it was defended
  twice. The shortened system prompt no longer forbids that word, and the
  missed-capture fact does not say when the opponent can take back.
- Next: fix that on its own branch.

## 2026-10-12 — the coach stops calling defended pieces free

- Merged `feature/voice-labels` into `develop` at `f97a10e`.
- On `feature/capture-claims`, committed at `6d7371e`, build `2026-10-11.2`:
  - When the engine's preferred move is a capture the opponent can take back,
    the fact sent to the model now says it is an exchange and nothing is won
    outright. This applies when the capture nets less than 2 points; a capture
    netting 2 or more is still described as winning material.
  - The system prompt forbids calling anything free, hanging, loose,
    unprotected or undefended unless the facts say so.
  - A code check discards a comment that uses one of those words when the
    facts sent to the model support none of them. The note then says the
    comment was discarded.
  - A missed capture that nets 2 or more points ranks ahead of lesser reasons.
- Tested with stand-in replies, including a missed queen capture answered "a
  free queen", which was discarded.
- The exact 4. e3 position from the earlier gremlin did not reproduce as a
  flagged move in testing, so that case is untested.
- In a real game on 2026-10-12 the visible comments were consistent with the
  engine's facts, including a "free knight" that really was free.
- Known limit: the check looks at the facts as a whole, so a wrong "free" can
  pass when another piece in the same position really is undefended.
- Narrowed after review, build `2026-10-12.1` (not yet committed): the check
  now counts one of those words as a claim only in a sentence that also names
  a square. The first version would have discarded true comments whose closing
  habit used words like "loose" or "unprotected" as general advice, such as
  "keep scanning for loose pieces". A new limit follows: a false claim written
  without naming a square is not caught.
- Widened, build `2026-10-12.2` (not yet committed): the square pattern now
  also counts a square inside move notation ("Nxe4", "Qh5", "dxc5"), not only
  one standing on its own ("on c5"). The `2026-10-12.1` pattern missed those,
  so "Nxe4 wins a free pawn" would have passed.
- Next: merge into `develop` and release.

## 2026-10-12 — release 1.2.0 and choosing the coach model

- Released 1.2.0: `main` at `64e57cb`, tagged `v1.2.0`. The published artifact
  was republished from it.
- The player confirmed on 2026-10-12 that spoken comments work in the
  published artifact too, which settles D007's untried point.
- On `feature/coach-model-settings`, committed at `eacdaf9`, build
  `2026-10-12.3`: the "Coach model" panel on the locally served page, offering
  the local model, an OpenAI-compatible service, or Anthropic, with the
  player's own key kept in the browser.
- Tested against stand-ins for OpenAI and Anthropic: a rejected key, a working
  key, the `max_tokens` retry, the Anthropic headers, a flagged move commented
  through the Anthropic stand-in, settings surviving a reload, and no key in
  any project file.
- Confirmed in a real game on 2026-10-12 with the local model, where a comment
  was written and spoken through the new code.
- The real OpenAI and Anthropic services remain untested.
- Recorded D009 (the player chooses the coach model on the local page),
  superseding D006 in part.
- Next: merge into `develop` and release.

## 2026-10-12 — release 1.3.0 and preparing the public release

- Released 1.3.0: `main` at `0b37017`, tagged `v1.3.0`. The published artifact
  was republished from it.
- On `feature/public-release`:
  - `LICENSE` added (GPL-3.0);
  - `pyproject.toml` given a licence, `GPL-3.0-or-later`;
  - `README.md` rewritten for visitors;
  - recorded D010 (the repository is public and licensed GPL-3.0-or-later).
- The whole git history was searched for API keys, private keys and tokens
  before going public; none were found.
- Next: merge, release 1.3.1, then switch the repository to public on GitHub.

<!-- Entry shape:

## YYYY-MM-DD — short summary of the session

- What you actually did.
- What broke and how you diagnosed it.
- Dead ends — what you tried that didn't work, and why you abandoned it.
- Wrong conclusions you reached and later corrected (these are gold).
- Gremlins — the environment bug, the tooling quirk, the thing that confused
  you twice.
-->
