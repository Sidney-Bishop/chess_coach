# Knowledge Bundle Update Log

The bundle's dated change history. **Append-only**, newest section at the top or
the bottom — pick one and keep it. Each entry says what changed in the *bundle*:
concepts created, corrected, superseded, or closed.

This is not the project journal. `docs/journal.md` records what happened in a
working session — the road, the dead ends, the gremlins. This log records what
changed in the knowledge, which is a much smaller and slower stream. When a
session produces a durable finding, the journal gets the narrative and this log
gets the one-line record of the concept that now carries it.

## 2026-10-09

* **Creation**: Established the OKF v0.1 knowledge bundle at `knowledge/` when
  chess_coach was scaffolded by project-bootstrap. Skeleton created: the
  root [index](/index.md), [overview](/overview.md),
  [conventions](/conventions.md), [architecture](/architecture.md),
  [pitfalls](/pitfalls.md), the [decisions](/decisions/) and
  [open-questions](/open-questions/) areas with their indexes, and this log.
* **Creation**: [D001 — scaffolded with project-bootstrap](/decisions/D001-scaffolded-with-project-bootstrap.md),
  the project's first decision and the worked example every later concept
  follows for shape.
* **Note — what this bundle does and does not hold.** D-IDs and Q-IDs are born
  here as concepts; there is no separate `docs/decisions.md` log to keep in
  sync. `docs/journal.md` is **not** represented in this bundle and remains
  authoritative for session-level detail. See the scope section in
  [conventions](/conventions.md).
* **Creation**: three decisions setting the tutor's design —
  [D002 — engine judges, LLM explains](/decisions/D002-engine-judges-llm-explains.md) (Active),
  [D003 — repo is the source of truth; the playable page runs as a published Claude artifact](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md)
  (Provisional, pending the first full game played end to end with live
  commentary), and
  [D004 — coaching is pitched at a 500-600 rated player](/decisions/D004-coaching-pitched-at-500-600-player.md) (Active).
  Linked from the [decisions index](/decisions/); the root [index](/index.md)
  range updated to D001–D004.
* **Creation + supersession**: two decisions moving the page off the artifact
  and commentary onto a local model —
  [D005 — the page runs served locally; the published artifact is an optional cloud build](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md)
  (Active, supersedes D003) and
  [D006 — commentary provider is local-omlx by default; cloud-claude only in the artifact, with no automatic fallback](/decisions/D006-commentary-provider-local-omlx-default.md)
  (Active).
  [D003](/decisions/D003-repo-source-of-truth-page-runs-as-artifact.md) marked
  **Superseded** by D005 — status only, content unchanged. Its validation event
  was partly met (live Claude commentary worked in the artifact), but the
  artifact's content-security policy blocks fetches to a local model server.
  Linked from the [decisions index](/decisions/) with the D003 → D005 chain
  recorded; the root [index](/index.md) range updated to D001–D006.

## 2026-10-10

* **Rewrite**: [Architecture](/architecture.md) rewritten from the scaffold's
  placeholders to describe the page as built at build `2026-10-10.4`: the files
  under `web/`, serving over HTTP rather than `file://`, the engine worker and
  its single search queue, the judging flow and thresholds, the facts computed
  in code, the `local-omlx` and `cloud-claude` providers and how the page
  chooses between them, the answer marker and length cap, persistence in
  browser storage, and how `scripts/make_artifact.py` derives the artifact
  form. Links [D002](/decisions/D002-engine-judges-llm-explains.md),
  [D004](/decisions/D004-coaching-pitched-at-500-600-player.md),
  [D005](/decisions/D005-page-served-locally-artifact-optional-cloud-build.md)
  and [D006](/decisions/D006-commentary-provider-local-omlx-default.md).
  `generated` moved to 2026-10-10 and `stale_after` to 2027-01-08.
* **Creation**: five open questions seeding the backlog, all **Open** —
  [Q001 — how strong should the level-1 opponent be for a 500-600 rated player?](/open-questions/Q001-level-one-opponent-strength.md),
  [Q002 — are the flag thresholds right?](/open-questions/Q002-flag-thresholds.md),
  [Q003 — how should opening principles be coached?](/open-questions/Q003-coaching-opening-principles.md),
  [Q004 — how do we know a comment says nothing false?](/open-questions/Q004-checking-comments-for-false-statements.md) and
  [Q005 — should the coach remember patterns across games?](/open-questions/Q005-patterns-across-games.md).
  Linked from the [open-questions index](/open-questions/); the root
  [index](/index.md) line updated to Q001–Q005.

## 2026-10-11

* **Creation**: two decisions, both **Active** —
  [D007 — the coach's comments are spoken with the browser's built-in speech synthesis](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md)
  and
  [D008 — branching and release model: main for releases, develop for integration, feature branches off develop](/decisions/D008-branching-main-releases-develop-integration.md).
  Neither supersedes anything. Linked from the [decisions index](/decisions/)
  and added to its Standalone list; the root [index](/index.md) range updated
  to D001–D008.
* **Update**: [Architecture](/architecture.md) gains a section on the coach
  voice — where speech is triggered, the notation-to-words step, the controls,
  the `chess-coach-v1-voice` storage key, and behaviour without speech
  support — and the key is added to Persistence. The cited build moves to
  `2026-10-10.5`, and [D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md)
  is added to its links. `generated` moved to 2026-10-11 and `stale_after` to
  2027-01-09.
* **Update**: [Architecture](/architecture.md) describes the voice list's two
  groups, "On this computer" and "Online: text is sent to the provider", and
  the warning line shown when an online voice is chosen. The cited build moves
  to `2026-10-11.1`. `generated` (2026-10-11) and `stale_after` (2027-01-09)
  were already current. The trade-off in
  [D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md)
  that the list does not mark local and network voices is now addressed in
  the code; D007 is left unedited, because decisions are not edited in place.

## 2026-10-12

* **Update**: [Architecture](/architecture.md) describes the changes to the
  judging flow in builds `2026-10-11.2` to `2026-10-12.2`: the net value of
  the engine's preferred capture, the theme order with a missed capture netting 2 or more
  points ahead of lesser reasons, the exchange wording for a lesser capture
  the opponent can take back, and the capture detail on the preferred-move
  line. The answer section gains the claim check (`unsupportedClaim`), which
  counts a forbidden word only in a sentence that names a square, on its own
  or inside move notation, and the prompt rule it backs. The cited build
  moves to `2026-10-12.2`, and
  [Q004](/open-questions/Q004-checking-comments-for-false-statements.md) is
  added to its links. `generated` moved to 2026-10-12 and `stale_after` to
  2027-01-10.
* **Partial**: [Q004 — how do we know a comment says nothing false?](/open-questions/Q004-checking-comments-for-false-statements.md)
  marked **Partial**, `closed_by` the code check in build `2026-10-12.2`.
  Answered: unsupported claims, in a sentence naming a square, that a piece
  is free are discarded. Still open: the check reads the facts as a whole, a
  false claim naming no square is not caught, the 4. e3 case is untested,
  other false statements and reviews are unchecked. Moved to
  "Partially answered" in the [open-questions index](/open-questions/); the
  root [index](/index.md) line updated.
* **Creation + partial supersession**:
  [D009 — on the locally served page the player chooses the coach model: local, an OpenAI-compatible service, or Anthropic, with their own key](/decisions/D009-player-chooses-coach-model-on-local-page.md)
  (Active, supersedes D006 scoped to which providers the locally served page
  may use).
  [D006](/decisions/D006-commentary-provider-local-omlx-default.md) marked
  **Superseded** by D009 (scoped) — status fields and Status prose only,
  content unchanged; it still governs the local default, no automatic
  fallback, cloud Claude for the artifact, and the oMLX settings. The
  [decisions index](/decisions/) gains the D009 entry and a D006 → D009 chain,
  and D006 leaves the Standalone list; the root [index](/index.md) range
  updated to D001–D009.
* **Update**: [Architecture](/architecture.md) rewrites the commentary
  providers section for build `2026-10-12.3`: the three providers on the
  local page, the Coach model panel, the `chess-coach-v1-provider` storage
  key, the connection check, Save and test, error handling, and the retry for
  newer models. The `config.js` bullet, serving, answer-retry, persistence
  and external-services text are brought in line. The cited build moves to
  `2026-10-12.3`, and
  [D009](/decisions/D009-player-chooses-coach-model-on-local-page.md) is added
  to its links. `generated` (2026-10-12) and `stale_after` (2027-01-10) were
  already current.
* **Note**: the player confirmed on 2026-10-12 that spoken comments work in
  the published artifact, which settles the point
  [D007](/decisions/D007-coach-comments-spoken-with-browser-speech-synthesis.md)
  lists as untried. D007 is left unedited, because decisions are not edited
  in place; the confirmation is in `docs/journal.md`.
* **Creation**: [D010 — the repository is public and licensed GPL-3.0-or-later](/decisions/D010-repository-public-gpl-3-or-later.md)
  (Active). Supersedes nothing: it relates to
  [D008](/decisions/D008-branching-main-releases-develop-integration.md),
  answering D008's reason to revisit if the repository is made public, but
  D008's privacy was a Context fact, not one of its decision points, so D008
  is unchanged and fully in force. Linked from the
  [decisions index](/decisions/) and added to its Standalone list; the root
  [index](/index.md) range updated to D001–D010.
