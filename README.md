# Chess Coach

A chess tutor that runs in your browser. You play against the Stockfish engine,
and when one of your moves is worth talking about, a coach explains it in plain
words and can read it aloud. It is pitched at beginners rated about 500-600.

## How it works

- **The engine judges, the language model only explains.** Stockfish runs in
  the page and checks every move you make. When a move loses enough to matter,
  or punishes your opponent's mistake, the page works out the facts in code
  (what you missed, what the opponent can now take, who is ahead) and a
  language model turns them into one or two sentences.
- **It stays quiet on ordinary moves.** Mistakes, blunders and good replies are
  flagged; everything else gets no comment.
- **A short review at the end** sums up what came up in the game.
- **Optional voice.** Tick "Speak comments" and the browser reads each comment
  aloud, with chess notation turned into words ("knight takes E 4, check").

## Run it

You need Python 3 (only to serve the files) and a current browser such as
Chrome.

```bash
git clone https://github.com/Sidney-Bishop/chess_coach.git
cd chess_coach/web
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open <http://localhost:8080/>. The page must be served like this: opened
as a `file://` page, the browser will not start the chess engine.

## Choose who writes the comments

Open **Coach model** in the Coach panel and pick one:

- **Local model (oMLX)**, the default: a model server on your own machine at
  `http://127.0.0.1:8000`, speaking OpenAI's chat-completions format. Free.
- **OpenAI-compatible service**: OpenAI with your own API key, or a local
  Ollama or LM Studio server at its own address (no key needed).
- **Anthropic**, with your own API key.

Press **Save and test** to check the setup. API keys are kept only in your
browser's storage, never in the project's files. Paid services charge your
account for each comment. With no model set up at all you can still play: each
flagged move shows the engine's verdict in plain text.

## Documentation map

Durable knowledge lives in **`knowledge/`**, an OKF v0.2 bundle: a short root
index plus one file per concept. Read it in two steps — `knowledge/index.md`
first, then the one or two concepts whose descriptions match what you need. The
index says what each concept is *for*; it deliberately doesn't summarise
contents, because a summary there would rot.

| Location                        | Kind             | Read it for…                        | Update style           |
|---------------------------------|------------------|-------------------------------------|------------------------|
| `knowledge/index.md`            | Index            | **Start here.** What exists, and where | Update with concepts|
| `knowledge/overview.md`         | State            | What this is; current state          | Overwrite              |
| `knowledge/architecture.md`     | State            | How it's built right now             | Overwrite              |
| `knowledge/decisions/`          | Decision history | What we chose and why (D-IDs)        | New file + supersede   |
| `knowledge/open-questions/`     | State + history  | What we don't know yet (Q-IDs)       | New file; close, don't delete |
| `knowledge/pitfalls.md`         | Invariants       | What fails quietly when broken       | Append entries         |
| `knowledge/conventions.md`      | Reference        | How to add to the bundle; how we work| Overwrite              |
| `knowledge/log.md`              | History          | What changed in the knowledge, dated | Append-only            |
| `docs/journal.md`               | Session history  | The road: what happened, what broke  | Append-only, dated     |

`docs/decisions.md` and `docs/open_questions.md` are **signposts** pointing into
the bundle — they hold no records. Don't append to them.

**Routing rule** — where does a sentence go? `true now` → `overview.md` or
`architecture.md` · `a choice someone will later question` → a new D-ID concept ·
`something we don't know yet` → a new Q-ID concept · `something that happened` →
`docs/journal.md` · `a constraint that fails quietly` → `pitfalls.md`.

## Layout

```
chess_coach/
├── web/            # the page: index.html, coach.js, config.js, vendor/
├── scripts/        # make_artifact.py, prompt_trial.py
├── knowledge/      # the knowledge bundle above
├── docs/           # journal and signposts
└── src/            # Python package from the scaffold (unused by the page)
```

Work happens on `feature/<name>` branches off `develop`; `main` receives only
tagged releases (decision D008).

## Licence

Chess Coach is free software, licensed under the GNU General Public License,
version 3 or (at your option) any later version. See [LICENSE](LICENSE).

It includes third-party code in `web/vendor/`, listed with versions and
checksums in `web/vendor/VENDORED.txt`:

- [Stockfish](https://stockfishchess.org/) 10 (via the `stockfish` npm package
  10.0.2), GPL-3.0;
- [chess.js](https://github.com/jhlywa/chess.js) 0.10.3, BSD-2-Clause.
