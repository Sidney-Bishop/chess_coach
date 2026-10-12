---
type: Reference
title: "chess_coach — Architecture"
description: How chess_coach is built right now — the files under web/, how the page is served, the engine queue, the judging flow, the commentary providers and the Coach model panel, the spoken coach voice, the move sounds, persistence, and how the artifact form is derived.
tags: [reference, architecture, web, engine, commentary]
generated: { by: human:jason-roche, at: 2026-10-12T00:00:00Z }
stale_after: 2027-01-10T00:00:00Z
---

How chess_coach is built **right now** — the moving parts, how they fit, the
key data flows, where things live, external services, and the non-obvious
constraints.

This is a **state** concept: overwrite it as the architecture changes. The
*reasons* the architecture is shaped this way live in [decisions](/decisions/);
the *story* of how it got there lives in `docs/journal.md`. This concept just
says what *is*.

All of this describes the code as of 2026-10-12, build `2026-10-12.4`.

# Components

The product is a single browser page under `web/`. There is no server-side
code: the engine, the judging and the calls to the model all run in the page.

- `web/index.html` — a complete HTML document: the markup for the board, the
  coach panel, the controls and the scoresheet, plus all the CSS inline. It
  loads three scripts in order: `vendor/chess.js`, `config.js`, `coach.js`.
  Each `src` carries `?v=<build>` so a new build is not served from the
  browser cache.
- `web/config.js` — sets `window.CHESS_COACH_CONFIG.local`: the oMLX endpoint
  (`http://127.0.0.1:8000`), the bearer token (the loopback literal `claude`,
  not a secret), the move model, the review model, temperature (0.2),
  `maxTokensMove` (1500), `maxTokensReview` (3000) and `timeoutMs` (180000).
  The endpoint and models are the local model's starting settings; the
  temperature, token limits and timeout apply to every provider on the local
  page. Keys are never kept here. `coach.js` has defaults for every field.
- `web/coach.js` — all the application logic, in one IIFE: the board and move
  input, the engine wrapper, the engine opponent, the judging of the player's
  moves, the commentary providers and the Coach model panel, the coach panel, the coach voice, the
  move sounds, the game review, persistence and event wiring. Its `BUILD` constant
  (`2026-10-12.4`) is shown
  in the engine line under the scoresheet.
- `web/vendor/` — third-party files, not edited by hand. `chess.js` 0.10.3
  (rules, legal moves, SAN, PGN) and `stockfish.asm.js` (Stockfish 10, npm
  `stockfish` 10.0.2, run as a Web Worker), with their licences.
  `VENDORED.txt` records each file's version and sha256.
- `scripts/make_artifact.py` — derives the published-artifact form of the page
  from `web/index.html` (see below).
- `scripts/prompt_trial.py` — a standalone trial of comment prompts against the
  local models through oMLX. Not used by the page.
- `src/chess_coach/` — the Python package from the scaffold; it holds only
  `__init__.py`.

# Serving the page

The page runs from `web/` over HTTP — for example `python3 -m http.server` run
in `web/`, opened at `http://localhost:<port>/` — not from `file://`, because
Chrome will not start the Stockfish Web Worker from a `file://` page, and only
a locally served page can reach a model server on the same machine
([D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md)).
The page has no network dependency beyond Google Fonts and, when coaching is
on, the chosen coach model's address (the oMLX endpoint by default) — and, if the player picks one, a voice the browser
provides over the network (see [The coach voice](#the-coach-voice)).

# The engine worker and the search queue

`Engine` in `coach.js` wraps one Web Worker started from
`vendor/stockfish.asm.js` and speaks UCI to it.

- **One queue.** Every search — the opponent's move and every judging analysis
  — goes through `Engine.search`, which chains onto a single promise, so
  searches run one at a time in the order they were asked for. Each sets
  `Skill Level`, the position and `go depth … movetime …`.
- **Cancellation.** New game, take back and resign bump a generation counter
  and send `stop`. A queued search from an older generation resolves `null`
  without running; results that arrive for an older generation are ignored.
- **Result.** The score comes from the last `info … pv` line of the main line
  (bound lines skipped), from the side to move's point of view. A mate in *n*
  is turned into ±(10000 − 10·*n*) centipawns and also kept as `mate`.
- **Analysis** runs at full strength: skill 20, depth 12, movetime 1000 ms.
- **The opponent** plays at one of five levels (Stockfish skill / depth, and a
  chance of playing a random legal move instead): 1 = 0/1/35%, 2 = 0/2/15%,
  3 = 5/5, 4 = 12/9, 5 = 20/14, each with movetime 1500 ms. Its move is shown
  no sooner than 450 ms after it started thinking.
- **Failure.** If the worker errors, or a search gives no `bestmove` within
  20 s, the engine is marked failed: the page says so, the opponent plays
  random legal moves, and no move is judged.

# Judging flow

The engine judges every player move; the model only explains
([D002](/decisions/D002-engine-judges-llm-explains.md)).

1. **Before the move.** When it becomes the player's turn, an analysis of the
   current position is queued at once, so it runs while the player thinks.
2. **After the move.** When the player moves, an analysis of the new position
   is queued, then the opponent's search behind it. A move that gives
   checkmate is not judged. A move that ends the game in a draw is not
   analysed; it is judged as leaving a level position (score 0), with the
   reason for the draw attached.
3. **Scoring.** Both scores are put from the player's side and clamped to
   ±1000 centipawns. *Loss* is the evaluation before minus the evaluation
   after. The opponent's last move is scored the same way, against the
   evaluation left by the player's previous judged move.
4. **Thresholds** (`COACH` in `coach.js`), in centipawns. These set the
   coach's quiet, beginner-level pitch
   ([D004](/decisions/D004-coaching-pitched-at-500-600-player.md)):
   - a move other than the engine's best that loses 400 or more is a
     **blunder**; 200 or more, a **mistake**;
   - neither is flagged if the player is still 500 or more ahead after the
     move (unclamped score);
   - otherwise, if the opponent's last move lost 200 or more and the player's
     reply lost 40 or less, the move is **well played**;
   - anything else gets no comment.
5. **Facts computed in code.** For a flagged move, `assess` works out, with
   chess.js: the engine's best line and the expected reply line (played out in
   SAN); material change along each; the overall standing after the move, in
   words (from "clearly losing" to "clearly winning", or forced mate); every
   capture open to the opponent and whether it could be taken back; which of
   the player's non-pawn pieces are hung, counting what the player's move just
   took so an even trade is not called a hung piece; what the opponent's
   replying piece attacks and whether each target is defended; whether the
   best move was a capture, whether the opponent could take back, and what
   it nets in points (the piece taken, less the capturing piece if it can be
   taken back); missed or allowed forced mate; a big lead dropped to level
   after a checking reply; and the draw reason. From these it picks one
   **theme** and one **key fact**. The theme is the first that applies, in
   this order: good capture or good reply (for a well-played move);
   stalemate or drawn a won game; missed checkmate; allowed checkmate; hung
   piece; missed capture netting 2 or more points; let a win slip; missed
   threat; any other missed capture; trade; other. The key fact follows the
   same order. For the engine's preferred capture:
   - netting 2 or more, it says the player missed the capture and either that
     the opponent cannot take back, or that the opponent can take back, so
     the player gives up one piece for the other, which wins material;
   - netting less, if the opponent can take back, it says the capture is an
     exchange, no material is won outright, and the engine gives no further
     reason; if the opponent cannot, it says the player missed a capture the
     opponent cannot take back.
6. **The note.** The note is added at once with an engine-only text written in
   code, the label and theme, and a line with the engine's preferred move and
   the evaluation before and after. The scoresheet marks the move `??`, `?` or
   `!`. If coaching is on, the model is sent only the side, the move, the
   verdict, the standing in words, the key fact and the preferred move —
   with, if that move is a capture, what it takes and whether the opponent
   can take back. Its answer replaces the text unless the claim check (see
   [below](#answer-marker-and-length-cap)) discards it. Each note says what
   wrote it, or "Engine verdict only" with the error, or with "the model's
   comment was discarded: it claimed something the engine's facts do not
   support".

At game end the review panel shows counts computed in code (blunders, mistakes,
punished mistakes, the move from which the player was clearly winning — 700 or
more). With coaching on, "Review this game" sends those counts, the themes and
every flagged note to the review model.

# Commentary providers

Where the page runs decides how it gets comments
([D006](/decisions/D006-commentary-provider-local-omlx-default.md)). On the
locally served page the player chooses the coach model from three providers
([D009](/decisions/D009-player-chooses-coach-model-on-local-page.md)); the
published artifact always uses cloud Claude. There is never a fallback from
one provider to another.

- **Choice.** At start, `initCoach` checks for `window.claude.use`. Present —
  the page is the published artifact — means `cloud-claude`. Absent means the
  locally served page: the "Coach model" panel is shown and the saved provider
  is loaded and connected.
- **The three providers on the local page** (`PROVIDERS` in `coach.js`):
  - **Local model (oMLX)** (`local`), the default. Calls
    `POST /v1/chat/completions` at its address, with the bearer token from
    `config.js` (not editable in the panel). The address and model names
    start from `config.js`; as of 2026-10-12 the move model is
    `Ornith-1.5-35B-A3B-OptiQ-4bit` and the review model `Qwen3.8-27B-4bit`.
  - **OpenAI-compatible service** (`openai`). Calls
    `POST <address>/v1/chat/completions` — OpenAI, or a local Ollama or LM
    Studio server. The address starts as `https://api.openai.com`; a key, if
    entered, is sent as `Authorization: Bearer <key>`, and with no key no
    `Authorization` header is sent. The model names start empty.
  - **Anthropic** (`anthropic`). Calls `POST https://api.anthropic.com/v1/messages`
    with the headers `x-api-key`, `anthropic-version: 2023-06-01` and
    `anthropic-dangerous-direct-browser-access: true`, and joins the reply's
    text blocks. The model names start as `claude-haiku-4-5-20251001` (move)
    and `claude-sonnet-5-5` (review); as of 2026-10-12 neither has been tried
    against the real service.

  An address has trailing slashes and a trailing `/v1` removed before
  `/v1/…` is added. Every provider uses the temperature, `max_tokens` and
  `timeoutMs` from `config.js`, a system and a user message, and plain
  `fetch`. The review uses the review model, or the move model if none is
  entered.
- **The panel.** `prov-box` in `index.html` is a collapsed `<details>` headed
  "Coach model" (its summary shows the provider and move model). It has a
  radio button per provider, and fields for the chosen one: address and model
  names for the local model; address, API key and model names for an
  OpenAI-compatible service; API key and model names for Anthropic. Key
  fields are password inputs. Notes say the local model is free, that OpenAI
  and Anthropic charge the player's account for each comment, and that a key
  is kept only in this browser, never in the project's files, where anyone
  using the same browser profile can read it. The artifact never shows the
  panel.
- **Storage.** All three providers' settings, keys included, and the chosen
  provider are saved in plain text under `chess-coach-v1-provider` when the
  player presses Save and test, and read back at start; only string fields
  of a known provider are taken.
- **Connection check** (`connectProvider`, run at start, on Retry and by
  Save and test). For the local model the page probes `GET /v1/models`
  (4 s timeout). For a service it sends nothing: it checks that an Anthropic
  key is entered, that a move model is entered, and that an OpenAI-compatible
  address is entered. If the check passes coaching is on. If not, coaching is
  off, the coach status line says "<provider> not ready · engine verdicts only",
  and the coach panel shows Retry with either "The local model at <address>
  did not answer…" (local model unreachable) or "The coach model is not
  working (<error>)…".
- **Save and test** (`saveProvider`) saves the panel, runs the connection
  check, then sends one test comment request with a short made-up fact
  sheet. It reports "Working: <model> (<provider>) replied.", "Connected, but
  the model gave no answer line. Try another model." (coaching stays on), or
  "Not working: <error>" (coaching turned off).
- **Errors during play.** A failed call leaves the note's engine-only text
  with the error. An unreachable server, or an HTTP 401, 403 or 404, also
  turns coaching off until Retry or Save and test succeeds; other errors
  (a timeout, any other HTTP error) leave it on. The error text includes the
  service's own message, cut to 200 characters.
- **Retry for newer models.** An OpenAI-compatible call refused with HTTP 400
  whose message mentions `max_tokens` or `temperature` is sent once more
  with `max_completion_tokens` in place of `max_tokens`, and without the
  temperature if the message mentioned it. An Anthropic call refused with
  HTTP 400 mentioning `temperature` is sent once more without it.
- **`cloud-claude`.** The page gets `sample` and `permissions` from
  `window.claude.use`. Coaching is off until the player presses "Turn on
  coaching" and grants permission; the choice is remembered. The call sends the
  system and user text joined into one prompt, with `modelTier: 'default'`;
  the review streams its text as it arrives. A `not_granted` error turns
  coaching off.

# Answer marker and length cap

Every provider's replies go through `extractAnswer`. The system prompt asks
for exactly one line starting `COMMENT:` (move) or `REVIEW:` (review). The code:

1. drops everything up to the last `</think>`, if there is one;
2. takes the text after the **last** marker — a reply with no marker yields
   nothing, and the reasoning is never shown;
3. keeps the first paragraph, collapses whitespace, and strips quotes,
   brackets and asterisks from the ends;
4. keeps whole sentences up to the cap: 2 sentences / 40 words for a comment,
   3 / 75 for a review. The first sentence is always kept; a later one is
   dropped if it would take the total over the word cap. The prompts ask for
   30 and 60 words; the code's cap is the backstop.

On the locally served page, whichever provider is chosen, a reply with no
answer is retried once; if the retry has none
either, the call fails with "no answer in the reply" and the note keeps its
engine-only text.

**Claims of a free piece.** `MOVE_SYSTEM` tells the model never to call a
piece or pawn free, hanging, loose, unprotected or undefended unless the facts
say it is not defended or that the opponent cannot take back. In `assess`,
each move comment then goes through `unsupportedClaim`, which splits the
comment into sentences. A sentence counts as a claim only if it contains one
of the words *free*, *for nothing*, *hanging*, *hung*, *unprotected*,
*undefended*, *unguarded* or *loose* **and** names a square — a lower-case
file `a`–`h` followed by a rank `1`–`8` and no further digit, coming at the
start of the sentence, after a character that is not a letter, or after a
piece letter (`K`, `Q`, `R`, `B`, `N`) or `x`. So a square counts whether it
stands on its own ("on c5") or sits inside move notation ("Nxe4", "Qh5",
"dxc5"). General advice with no square, such as "keep
scanning for loose pieces", is not a claim. The comment is discarded if any
sentence is a claim and the whole text sent to the model contains none of
*for free*, *cannot take back*, *could not take back*, *not defended* or
*where it could be taken*. A discarded comment is not retried and does not
turn coaching off; the note keeps its engine-only text, which is what is
spoken, and says the comment was discarded. Limits: the check reads the facts
as a whole, not per piece, so a wrong "free" passes when the facts call some
other piece free or undefended; and a false claim that names no square ("you
left your knight hanging") is not caught. Game reviews are not checked
([Q004](/open-questions/Q004-checking-comments-for-false-statements.md)).

# The coach voice

Comments and the game review can be read aloud with the browser's own speech
synthesis (`window.speechSynthesis`)
([D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md)).
There is no server or model behind it; the voices are whatever the browser
offers.

- **Controls.** A row under the coach heading in `index.html` (`voice-row`):
  a "Speak comments" checkbox (`voice-on`), a voice list (`voice-name`) and a
  speed list (`voice-rate`: Slow 0.85, Normal 1, Fast 1.2), with a warning
  line (`voice-hint`) below them, hidden unless an online voice is chosen.
  Each finished note
  card has a Speak button (`speak-btn`), and the review has its own
  (`review-speak`).
- **Storage.** `{ on, name, rate }` is saved under `chess-coach-v1-voice` on
  every change and read back by `initVoice` at start; a saved rate other than
  the three offered is ignored. Speaking is off until the player ticks the box.
- **Where speech is triggered.** `say` speaks only when speaking is on, unless
  forced by a button.
  - In `assess`, a note that is not waiting for the model (coaching off) is
    spoken at once; a note waiting for the model is spoken when its reply
    arrives or fails, and only if the game has not been reset or taken back
    since (`myGen === gen`). Either way it is spoken once, as `noteSpeech`:
    the verdict label, then the text — "Blunder. …".
  - When the model's game review arrives it is spoken, prefixed "Game review.".
  - Ticking the box says "Coach voice on."; unticking it stops speech.
  - Forced, even with speaking off: a note's Speak button, the review's Speak
    button, and a short sample when the voice or speed is changed.
- **One voice at a time.** `say` cancels whatever is being spoken before it
  starts. `stopEngine` — called by new game, take back and resign — also stops
  speech.
- **Notation to words.** `speakable` rewrites SAN before it reaches the voice:
  castling (`O-O`, `O-O-O`), piece moves and captures, pawn captures, bare
  squares, promotion and check / checkmate — "Nxe4+" becomes "knight takes
  E 4, check". A comma is added after "check" when more words follow.
- **Voice list.** `loadVoices` keeps the voices whose language starts `en`,
  or all voices if there are none, with voices the browser marks local first,
  then by name. It runs at start and again on `onvoiceschanged`, because
  Chrome fills the list a moment after load. The voice used is the saved one,
  else the browser's default, else one matching the browser language, else the
  first.
- **Local and online voices.** `renderVoice` splits the list into two
  `<optgroup>`s by the browser's `localService` flag: "On this computer" and
  "Online: text is sent to the provider". An empty group is left out. Each
  online voice's option also ends "· online". When the voice in use is an
  online one, the warning line shows "<name> is an online voice: the text of
  each comment is sent to its provider to be spoken. Voices under "On this
  computer" keep it on your machine." Changing the voice re-renders the row,
  so the warning follows the selection.
- **No speech support.** If `speechSynthesis` or `SpeechSynthesisUtterance` is
  missing, the voice row stays hidden, no Speak buttons are drawn, and `say`
  does nothing.

# Move sounds

Every move on the board, the player's and the engine's, plays a short sound
made with Web Audio (`AudioContext`, or `webkitAudioContext`). The sounds are
synthesised in code, so there are no sound files and nothing goes over the
network.

- **Three sounds.** `soundKind` picks one from the move chess.js returns:
  - **check** if the SAN contains `+` or `#`: the move sound followed by two
    sine tones, 880 Hz then 1175 Hz. Check outranks capture, so a capture
    that gives check plays this one;
  - **capture** if the move has `captured` or the flags `c` or `e`: noise
    through a 900 Hz band-pass with a 180 Hz sine thump, about 90 ms;
  - **move** otherwise: noise through an 1800 Hz band-pass, about 60 ms.
  Both building blocks, `knock` (filtered noise) and `tone` (a sine), fade
  out on an exponential envelope.
- **Where it is triggered.** `playMoveSound` runs right after a successful
  `game.move` in `playerMove`, and in `engineTurn` after the engine's move or
  the random fallback move. Nothing plays when a game is restored or a move
  is taken back.
- **Unlocking audio.** Browsers start audio only after a user gesture, so the
  `AudioContext` is created or resumed by `audioCtx` on the first
  `pointerdown` on the page, and again before each sound.
- **Control.** A "Move sounds" checkbox (`sound-on`) in `sound-row`, under the
  game buttons. It is on by default. Ticking it plays one move sound as a
  sample. If the browser has no `AudioContext`, the row stays hidden and no
  sounds play.
- **Storage.** `{ on }` is saved under `chess-coach-v1-sound` when the box
  changes and read back by `initSound` at start.
- **Errors.** Any failure inside the audio calls is caught and the move goes
  ahead silently.

# Persistence

The game is saved to `localStorage` under `chess-coach-v1` on every render and
after every judgement: the PGN, side, level, board orientation, resigned flag,
the notes (any pending one saved as not pending), the evaluation track, and
the review only if a model wrote it. On load it is restored with each field
checked, and anything inconsistent with the restored game dropped. The cloud
opt-in is a separate key, `chess-coach-v1-coach`; the voice settings
another, `chess-coach-v1-voice`; the move-sound setting another,
`chess-coach-v1-sound`; and the coach model settings, keys included,
another, `chess-coach-v1-provider`. Every storage access is in
`try/catch`; the page works without storage. When `window.claude.hot` exists,
the page also hands it a snapshot and starts from its data.

# The artifact form

`scripts/make_artifact.py` reads `web/index.html`, takes the inside of `<head>`
and of `<body>`, drops the `<meta>` tags, and writes the head contents followed
by the body contents to stdout — a fragment with no doctype, `html`, `head` or
`body` tags. The `<script>` tags are left as they are, so `vendor/chess.js`,
`config.js` and `coach.js` must be published alongside the fragment. In the
artifact `window.claude` exists, so the page uses `cloud-claude` and the local
settings in `config.js` go unused
([D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md)).

# External services & configuration

- **oMLX** at `http://127.0.0.1:8000` (OpenAI-compatible), for the local page.
  It must answer the browser's CORS preflight for `Authorization` and
  `Content-Type`; it did when probed with oMLX 0.6.4 on 2026-10-09
  ([D006](/decisions/D006-commentary-provider-local-omlx-default.md)).
  Configured in `web/config.js`; there are no environment variables.
- **An OpenAI-compatible service** or **Anthropic's Messages API**, if the
  player chooses one in the Coach model panel, called from the browser with
  the player's own key
  ([D009](/decisions/D009-player-chooses-coach-model-on-local-page.md)). As of
  2026-10-12 neither has been tried against the real service, only against
  stand-ins.
- **Claude**, through the artifact runtime's `sample` capability, for the
  published artifact only. No API key.
- **Google Fonts**, for the page's typefaces.

# Constraints worth knowing

- **The build number lives in two places**: `BUILD` in `coach.js` and the
  `?v=` on each `<script>` in `index.html`. Change both, or a cached script can
  run under a page that claims a new build.
- **Judging shares the engine with the opponent.** Analyses and the opponent's
  search queue behind each other, so a slow analysis delays the opponent's
  move.
- **Thresholds compare clamped scores**, but the "still winning" check uses the
  unclamped score after the move.
- **If the engine fails, coaching stops entirely**, whatever the provider —
  there is nothing to judge with.

# Related

- [Overview](/overview.md) — what the project is, above the level of its parts.
- [D002](/decisions/D002-engine-judges-llm-explains.md) — why the engine
  judges and the model only explains.
- [D004](/decisions/D004-coaching-pitched-at-500-600-player.md) — the pitch the
  thresholds and prompts serve.
- [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) —
  why the page is served locally and the artifact is derived.
- [D006](/decisions/D006-commentary-provider-local-omlx-default.md) — the
  local default, cloud Claude for the artifact, and the no-fallback rule.
- [D009](/decisions/D009-player-chooses-coach-model-on-local-page.md) — why
  the player chooses the coach model on the local page.
- [D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md) —
  why comments are spoken with the browser's speech synthesis.
- [Q004](/open-questions/Q004-checking-comments-for-false-statements.md) —
  checking comments for false statements; the claim check partly answers it.
- [Decisions](/decisions/) — the full log.
- [Pitfalls](/pitfalls.md) — the constraints that fail quietly.
