---
type: Decision
title: "D006 — Commentary provider is local-omlx by default; cloud-claude only in the artifact, with no automatic fallback"
description: The locally served page gets its commentary from local models through oMLX's OpenAI-compatible endpoint; cloud Claude is used only by the published artifact, and the page never falls back from one provider to the other.
tags: [decision, llm, commentary, provider, omlx, D006]
decision_id: D006
status: Active
date: 2026-10-09
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-09. Supersedes: none. Superseded by: none.

# Context

Under [D002](/decisions/D002-engine-judges-llm-explains.md) the engine judges
and the model only explains, which is within what local models can do. The
cloud provider is called once per flagged move — two in a 32-move game on
2026-10-09 — which is a modest cost, but a recurring one for something played
daily.

# Decision

1. **A small provider abstraction with two providers:** `local-omlx` and
   `cloud-claude`.
2. **The provider is tied to where the page runs.** The locally served page
   (see [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md))
   uses `local-omlx`; the published artifact uses `cloud-claude`. Nothing on
   the local page can reach the paid provider.
3. **`local-omlx` calls the OpenAI-compatible `/v1/chat/completions` endpoint**
   of oMLX at `http://127.0.0.1:8000`, with plain `fetch` and no SDK.
4. **Endpoint, token, models, temperature and max tokens are configuration**
   in `web/config.js`.
5. **Models and settings** (as of 2026-10-09): per-move comments use
   `Ornith-1.5-35B-A3B-OptiQ-4bit`; the end-of-game review uses
   `Qwen3.8-27B-4bit`. Temperature 0.2; `max_tokens` 1500 for a move comment.
6. **Reasoning is stripped.** Both models emit reasoning before the answer,
   sometimes as an inline `<think>` block, so the page strips any think block
   and takes the text after the last closing tag.
7. **The system prompt carries** the role, the 500-600 pitch from
   [D004](/decisions/D004-coaching-pitched-at-500-600-player.md), a firm length
   limit, and the rule that the model must not contradict or add to the
   engine's facts. Hung-piece and missed-capture facts and the theme label are
   computed in code; the model returns plain text.
8. **The page shows which provider is active** and tags every comment with what
   wrote it.
9. **No automatic fallback.** If oMLX is unreachable the page says so, shows the
   engine's verdict only, and offers a retry. It never switches provider.

# Rationale

- **No per-call cost** for something played daily.
- **D002's split means the model needs no chess strength of its own** — it only
  phrases facts the engine and the code have already established.
- **Evidence** — a probe run on 2026-10-09 against oMLX 0.6.4:
  - the CORS preflight for `/v1/chat/completions` returned
    `access-control-allow-origin: *` and allowed the `authorization` and
    `content-type` headers;
  - Ornith returned an accurate three-sentence comment in 7.0 s, 3.9 s of it
    model load;
  - Qwen returned an accurate comment in 31.9 s;
  - both put their reasoning in a separate `reasoning_content` field, with clean
    `content`.

# Trade-offs / risks

- Local models know less chess than cloud Claude, so the prompt must carry
  every fact the comment needs.
- Local commentary only works on the machine running oMLX.

# When to revisit

- If local comments prove inaccurate or unhelpful in real games despite the
  prompt carrying the engine's facts.
- If the models named above are replaced, or oMLX's API or CORS behaviour
  changes — re-run the probe and record the new evidence.

# Related

- [D002](/decisions/D002-engine-judges-llm-explains.md) — why the model only
  explains.
- [D004](/decisions/D004-coaching-pitched-at-500-600-player.md) — the pitch the
  system prompt carries.
- [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) —
  where the page runs, which decides the provider.
- [Architecture](/architecture.md) — how the page is built and served.
