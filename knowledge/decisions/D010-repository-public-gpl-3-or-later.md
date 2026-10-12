---
type: Decision
title: "D010 — The repository is public and licensed GPL-3.0-or-later"
description: The GitHub repository is made public so friends can clone and play, and the whole project is licensed GPL-3.0-or-later to match the vendored Stockfish, with the vendored code keeping its own licences.
tags: [decision, licence, gpl, release, D010]
decision_id: D010
status: Active
date: 2026-10-12
supersedes: none
superseded_by: none
generated: { by: human:jason-roche, at: 2026-10-12T00:00:00Z }
---

# Status

**Active.** Date: 2026-10-12. Supersedes: none. Superseded by: none.

Relates to [D008](/decisions/D008-branching-main-releases-develop-integration.md)
without superseding it. D008 does not decide that the repository is private:
that is a fact in its Context, and making the repository public is one of its
reasons to revisit, which this decision answers. None of D008's decision
points is displaced, so its branching and release rules stay fully in force.

As of 2026-10-12 the licence is in place on `feature/public-release`; the
switch to public on GitHub is still to be made, after the next release.

# Context

[D008](/decisions/D008-branching-main-releases-develop-integration.md)
recorded that the repository was private because Stockfish is vendored under
GPL-3.0, and listed making it public as a reason to revisit, with the GPL
obligations to be met first. The player wants friends to be able to clone and
play it.

# Decision

1. **The repository `Sidney-Bishop/chess_coach` is made public.**
2. **The whole project is licensed GPL-3.0-or-later**, with the full licence
   text in `LICENSE` and `license = "GPL-3.0-or-later"` in `pyproject.toml`.
3. **The third-party code in `web/vendor/` keeps its own licences**, credited
   in `README.md` and `web/vendor/VENDORED.txt`: Stockfish 10 under GPL-3.0
   and chess.js 0.10.3 under BSD-2-Clause.
4. **`README.md` is rewritten for visitors.**

# Rationale

- GPL-3.0 matches the vendored Stockfish, so there is no question about
  combining licences, and BSD-2-Clause code may be included in a GPL work.
- **Evidence:** before going public, on 2026-10-12, the whole git history was
  searched for API keys, private keys and tokens, and none were found. The
  only token is the loopback literal in `web/config.js`, which only works
  against a server on the player's own machine.

# Trade-offs / risks

- Every commit carries the author's personal email address, which becomes
  public.
- Anyone may reuse the code under the GPL's terms.

# When to revisit

- If a dependency with a licence incompatible with GPL-3.0 is to be vendored.
- If a secret is ever committed: the history check must be repeated before
  any further publishing, and the secret revoked.

# Related

- [D008](/decisions/D008-branching-main-releases-develop-integration.md) —
  the branching and release model, which noted the repository was private and
  named going public as a reason to revisit.
- [D009](/decisions/D009-player-chooses-coach-model-on-local-page.md) — keys
  are kept in the browser, never in a project file, which keeps them out of
  the public history.
- [Architecture](/architecture.md) — the vendored files and `web/config.js`.
