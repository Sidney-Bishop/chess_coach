---
type: Decision
title: "D009 — On the locally served page the player chooses the coach model: local, an OpenAI-compatible service, or Anthropic, with their own key"
description: The locally served page gets a "Coach model" panel offering the local model (the default), any OpenAI-compatible service, or Anthropic, with the player's own key kept in the browser; supersedes D006 only in its rule that nothing on the local page can reach a paid provider.
tags: [decision, llm, commentary, provider, openai, anthropic, D009]
decision_id: D009
status: Active
date: 2026-10-12
supersedes: D006 (scoped: which providers the locally served page may use)
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-12T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-12. Supersedes: D006 (scoped: which providers the
locally served page may use). Superseded by: none.

**What D009 replaces in D006:** D006's rule that nothing on the local page can
reach a paid provider (its decision point 2, last sentence).

**What stays in force from D006:** the local model as the default; no
automatic fallback from one provider to another; the provider tied to where
the page runs for the published artifact, which uses cloud Claude; and the
oMLX settings in `web/config.js`.

# Context

A friend who clones the repo without a local model server could play, but
would get only the engine's verdicts.
[D006](/decisions/D006-commentary-provider-local-omlx-default.md) tied the
local page to the local model and kept the paid providers out of it entirely.

# Decision

1. **A "Coach model" panel on the local page offers three providers:**
   - Local model (oMLX), the default;
   - an OpenAI-compatible service — any address speaking OpenAI's
     chat-completions format, which covers OpenAI itself and local Ollama or
     LM Studio servers;
   - Anthropic's Messages API, called from the browser.
2. **The player enters the address, key and model names in the page.**
3. **Keys are kept only in the browser's storage**, never in a project file,
   and the panel says anyone using the same browser profile can read them.
4. **"Save and test" checks the setup at once.** For the local model it first
   asks the server for its model list; for the services it first checks that
   the needed fields are filled in. It then sends one short test comment
   request.
5. **A failure is shown and never switches provider.** An unreachable server,
   or a rejected key or model, also turns coaching off until the setup is
   fixed and retried.
6. **The published artifact is unchanged:** it shows no panel and uses Claude
   through the artifact runtime.
7. **Newer OpenAI models that reject `max_tokens` or a set temperature** get
   one retry with the settings they accept.

# Rationale

- Lets someone without a local model get explanations, using a service they
  choose and pay for, while keeping the free local default.

# Trade-offs / risks

- Keys sit in browser storage in plain text.
- Paid comments cost the player money per flagged move.
- The OpenAI and Anthropic paths were tested only against stand-ins on
  2026-10-12, not the real services, so the default Anthropic model names are
  unconfirmed.

# When to revisit

- When the real OpenAI or Anthropic service is first used: confirm the calls
  work from the browser and that the default Anthropic model names are
  accepted, and record the evidence.
- If keys kept in browser storage prove a problem in practice.

# Related

- [D006](/decisions/D006-commentary-provider-local-omlx-default.md) — the
  provider decision this supersedes in part; still in force outside that
  scope.
- [D002](/decisions/D002-engine-judges-llm-explains.md) — whatever the
  provider, the engine judges and the model only explains.
- [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md) —
  the locally served page and the published artifact.
- [Architecture](/architecture.md#commentary-providers) — how the providers
  and the panel work.
