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
