# Open Questions — see `knowledge/open-questions/`

**This file is a signpost, not a log. Do not append questions here.**

chess_coach records open questions as **concepts in the knowledge bundle**,
one file per question:

    knowledge/open-questions/Q<NNN>-<slug>.md

To see what's open, start at `knowledge/index.md`, then open
`knowledge/open-questions/index.md` — it groups every Q-ID as open, partially
answered, or closed, and says what closed each one.

To add one:

1. Pick the next `Q<NNN>` (zero-padded) and a slug that will still be accurate
   in a year — **the slug is frozen at creation and the file is never renamed**.
2. Give it `status: Open` and a `date_opened`. A question worth recording is
   usually worth stating its closure criteria up front, before the answer is
   known.
3. Add its bullet to `knowledge/open-questions/index.md` in the same commit.

Questions resolve **into** decisions. When one closes, set `status`,
`date_closed` and `closed_by`, move its bullet to the Closed group, and — if it
resolved into a decision — write that decision as a new `D<NNN>` concept. A
closed question is never deleted; the answer trail is the point.

The frontmatter fields and closure shapes are specified in
`knowledge/conventions.md`.

---

*Why this file exists at all:* `docs/open_questions.md` is a near-universal
convention, and a tool or agent asked to "record an open question" that finds
nothing here is liable to create one — forking the record in two places. This
signpost points the way instead. It holds no facts, so it cannot go stale except
in its pointer.
