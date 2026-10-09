---
type: Reference
title: "Bundle conventions and working conventions"
description: How this bundle is produced — type vocabulary, the <ID>-<slug> filename rule with slug-freeze, supersession and closure shapes, cross-linking, the as-of-date rule — and how work is done in this project.
tags: [reference, conventions, producer-rules, working-conventions]
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
stale_after: 2027-01-07T00:00:00Z
---

This concept has two halves. The first is **producer conventions**: the rules
that keep this bundle internally consistent as concepts are added. The second is
**working conventions**: how collaboration is done in chess_coach, which is
a different kind of rule but belongs in the same place a newcomer looks.

---

# Part 1 — Producer conventions

These are **this bundle's producer conventions**, not OKF v0.1 requirements —
OKF registers no type taxonomy and no filename scheme beyond the reserved
`index.md` / `log.md`. They are recorded here so future sessions keep the bundle
internally consistent.

## Type vocabulary

Every concept declares a `type` in its frontmatter. This bundle uses a fixed,
self-defined vocabulary (OKF does not register types centrally):

| `type`         | Used for                                                        |
|----------------|-----------------------------------------------------------------|
| `Overview`     | The single root orientation concept.                            |
| `Decision`     | A numbered D-ID decision. Historical record with a live status. |
| `Open Question`| A numbered Q-ID question, open or closed.                       |
| `Reference`    | Reference material — architecture, conventions, external notes. |
| `Invariant`    | A load-bearing constraint that must not be broken by accident.  |
| `Runbook`      | An operational how-to (invocation, procedure).                  |
| `Experiment`   | A dated real-use run and its findings.                          |

Consumers must tolerate unknown types gracefully; producers keep this list
current as new concepts are authored. Add a type when a genuinely new *kind* of
concept appears — not for every new topic.

## Filename = identity

- **`<ID>-<slug>.md`** for every D-ID and Q-ID concept
  (e.g. `decisions/D001-scaffolded-with-project-bootstrap.md`).
- **Slugs freeze at creation.** A concept's file is renamed *never* — later
  title or status changes do not rename the file, because the path is the
  concept's stable identity (its bundle-relative Concept ID). A superseded
  decision keeps its original filename and records the supersession in prose.
- **IDs are zero-padded to three digits** — `D001`, `Q001`, `D014`, `Q207`.
  Both series use the same rule, so `ls` sorts them in logical order and a
  search for a canonical ID finds its concept file.

> **Deliberate divergence.** The reference implementation this bundle is
> modelled on (tst_llm) pads D-IDs but *not* Q-IDs, because its concepts mirrored
> two source documents that happened to write their IDs differently — padded in
> one, bare in the other. That asymmetry was inherited from the source docs, not
> chosen. This bundle has no source docs to mirror: D-IDs and Q-IDs are **born
> here**, so one padding rule applies to both. If you ever migrate an existing
> project into this shape, match the source's literal ID form instead, and record
> the reason here.

## Concept frontmatter shapes

A **Decision** concept:

```yaml
---
type: Decision
title: "D014 — short statement of what was chosen"
description: One sentence a router can read to decide whether to open this file.
tags: [decision, <topic>, D014]
decision_id: D014
status: Active            # Active | Provisional | Superseded
date: YYYY-MM-DD          # when the decision was taken
supersedes: none          # none | DNNN | DNNN (scoped: <scope>)
superseded_by: none       # none | DNNN | DNNN (scoped: <scope>)
generated: { by: human:<id>, at: YYYY-MM-DDT00:00:00Z }   # actor per OKF s7; no spaces
---
```

An **Open Question** concept:

```yaml
---
type: Open Question
title: "Q007 — the question, phrased as a question"
description: One sentence a router can read, ending in the current disposition.
tags: [open-question, <topic>, Q007]
question_id: Q007
status: Open              # Open | Closed | Partial
date_opened: YYYY-MM-DD
date_closed: YYYY-MM-DD   # Closed only; absent when Open or Partial
closed_by: DNNN           # Closed or Partial only; absent when Open
generated: { by: human:<id>, at: YYYY-MM-DDT00:00:00Z }   # actor per OKF s7; no spaces
---
```

Every concept carries `generated: { by, at }` (OKF v0.2 s5.2) — `by` is an
actor (`human:<id>`, `process:<id>`, or `<producer>/<version>`; no spaces) and
`at` is the content's last meaningful change. Concepts of any type **other
than** Decision and Open Question must also carry `stale_after` (s5.5), an
absolute instant after which the checker fails the concept until the content
is refreshed and the date moved; the scaffold sets it 90 days out. Decisions
and questions are history — superseded or closed, never stale — and must not
carry it. The rationale is D015 in the project-bootstrap scaffolder's own bundle; the
field definitions are OKF v0.2 s5.

Body sections follow the worked example in
[D001](/decisions/D001-scaffolded-with-project-bootstrap.md): Status, Context,
Decision, Rationale, Trade-offs / risks, When to revisit, Related.

## Supersession frontmatter shapes

The `supersedes` and `superseded_by` keys on a Decision concept stay
**machine-routable**: each takes exactly one of three shapes —

- `none` — supersedes / is superseded by no prior decision;
- a bare `DNNN` — a clean, whole supersession;
- `DNNN (scoped: <scope>)` — a *partial* supersession, where the relation holds
  only within `<scope>`.

Anything more than this — the reasoning, the caveats, what still governs what —
lives in the prose **Status** section, never in the frontmatter. A decision that
displaces something that was never a D-ID (an implicit operational assumption,
say) records `none` in the frontmatter and carries the real story in prose.

**A superseded decision is never edited except its status.** The old concept
keeps its slug, its content, and its reasoning; the new one references it. The
*path* of decisions is itself information.

## Open-question status & closure shapes

Every Open Question concept declares `status` and `date_opened` (ISO
`YYYY-MM-DD`). `status` takes exactly one of three values:

- `Open` — not yet resolved;
- `Closed` — resolved: into a decision, by a finding/measurement, or
  inconclusively;
- `Partial` — one sub-part answered, a named residual still open.

The closure fields differ by status:

- A **`Closed`** concept carries both `date_closed` and `closed_by`.
- A **`Partial`** concept carries `closed_by` only (pointing at the partial
  answer's source); `date_closed` is **absent** until full closure. The prose
  dates the partial answer and names the residual.
- An **`Open`** concept carries neither.

`closed_by` stays **machine-routable**, taking exactly one of three shapes —

- a bare `DNNN` — the decision the question resolved into;
- a bundle path — another concept that closed it (e.g. `/open-questions/Q004-….md`);
- short free text — a finding/measurement with no decision or concept to point
  at (e.g. `measurement`, `inconclusive — N=3 insufficient`).

The prose **Status** section carries all nuance: the disposition, split
resolutions, and any residual. The frontmatter says only *whether* it is open and
*what* closed it.

## Cross-linking

Links are **bundle-absolute** (leading `/`), so they survive files being moved
within a subdirectory. Forward links to not-yet-written concepts are encouraged —
a link to a concept that should exist is a useful marker, not an error.

## Version-sensitive claims carry an as-of date

Any claim about a moving value — a dependency version, a model id, a record
count, an OS version — is stated in prose with an explicit "as of YYYY-MM-DD".
Do not carry such claims forward from prose alone; verify against the code or the
binary. See the doc-drift invariant in [pitfalls](/pitfalls.md).

## Indexes are maintained by hand, in the same change

When a concept is created, closed, or superseded, update its area index
(`/decisions/` or `/open-questions/`) and, if the root shape changed, the root
[index](/index.md), **in the same commit as the concept itself**. An index that
lags the concepts is worse than no index: it is the file every reader loads
first, so its staleness propagates.

## Scope — what lives here and what does not

- **D-IDs and Q-IDs are born in this bundle.** There is no separate
  `docs/decisions.md` or `docs/open_questions.md` log to keep in sync. Those two
  paths exist as **signposts** pointing here; do not append records to them.
- **`docs/journal.md` is not represented in this bundle** and remains
  **authoritative** for session-level detail — what was tried, what broke, the
  dead ends. The bundle holds durable knowledge; the journal holds the road.
  [The log](/log.md) is the journal's distilled counterpart, not its replacement.
- **`docs/backlog.md` stays outside the bundle.** It is deliberately
  low-ceremony and edited freely; concept-shaping it would tax the one file whose
  value is being cheap to change.
- **`docs/philosophy.md`**, if present, teaches the State/History routing skill
  that underlies all of this. It is a guide, not project knowledge.

---

# Part 2 — Working conventions

How work is done in chess_coach. Violating these creates friction. The first
set is inherited from the project-bootstrap standard and holds for every project
of this shape; the second is project-specific and is filled in as patterns emerge.

## Inherited (generic)

- **The State / History axis is the bedrock.** Before writing anything, ask: is
  this State (overwrite) or History (append)? Within History: a decision
  (a concept in [/decisions/](/decisions/)) or session narrative
  (`docs/journal.md`)? Routing: *true now* → a state concept · *a choice someone
  will question* → a D-ID concept · *something that happened* → the journal ·
  *not yet decided* → a Q-ID concept · *queued work* → `docs/backlog.md`.
- **Append-only mechanical discipline on history.** Before committing an edit to
  `docs/journal.md` or to any existing concept, check the diff shape: insertions
  should far exceed deletions. A large deletion count means you are about to
  overwrite or roll something back — stop and look.
- **One thing at a time.** Single decision → single action → single terminal
  output → next decision. Don't queue several actions hoping one lands.
- **Verify before committing**, not after. A targeted read after every append
  confirms the file is in the shape you expect.
- **Tests stay green at every commit boundary.** If a change breaks a test, fix
  the test in the same commit or revert.
- **Commit at phase boundaries.** Each commit message tells the story of one
  decision or one shipped piece of work. The git log is part of the narrative.
- **Repeat the context check after compactions.** If the conversation has been
  compacted, reconfirm branch, HEAD vs origin, working tree, and recent
  decisions before acting. Don't assume the summary is complete. The root
  [index](/index.md) is the entry point for that re-orientation.
- **Update the knowledge in the same commit as the code that motivates it.**
  This is the discipline that stops docs and code drifting — the failure mode
  that kills every documentation convention.

## Project-specific (added as patterns emerge)

_TODO: As recurring preferences surface — tone, tooling, review discipline, file
handling, anything that would cause friction if violated — record them here.
Worked examples from other projects: "review files in an editor, not in terminal
output"; "pre-register falsification criteria before running an experiment";
"expects pushback on overclaims"; "scratch work is gitignored, probes are
committed". Add yours._

# Related

- [Overview](/overview.md) — what this project is and where to read next.
- [Pitfalls](/pitfalls.md) — the invariants these conventions protect.
- [D001](/decisions/D001-scaffolded-with-project-bootstrap.md) — the worked
  example of the Decision concept shape.
