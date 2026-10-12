# Open questions — chess_coach

The Q-ID question log: what this project wanted to know, and how each was
resolved. Questions resolve **into** a decision, are answered inline by a finding
or measurement, close inconclusively, or stay open. Open questions and decisions
are the two ends of one pipeline.

Each concept is one file, named `Q<NNN>-<slug>.md`, with the slug frozen at
creation. A closed question is **not deleted** — it keeps its file and records
what closed it, so the answer trail stays auditable. See
[conventions](/conventions.md) for the `status` / `date_closed` / `closed_by`
shapes.

Each bullet below ends in its status: **Open**, **Partial**, or
**Closed → what closed it**.

# Currently open

* [Q001 — How strong should the level-1 opponent be for a 500-600 rated player?](/open-questions/Q001-level-one-opponent-strength.md) - Level 1's strength against the target player has never been measured; early games suggest it is too weak or too erratic. **Open.**
* [Q002 — Are the flag thresholds right?](/open-questions/Q002-flag-thresholds.md) - The mistake, blunder and still-ahead thresholds are first guesses, to be settled from flag counts across several games. **Open.**
* [Q003 — How should opening principles be coached?](/open-questions/Q003-coaching-opening-principles.md) - D004 puts opening principles in scope, but they rarely cross a flag threshold; detect them in code or drop them. **Open.**
* [Q005 — Should the coach remember patterns across games?](/open-questions/Q005-patterns-across-games.md) - D004 calls for recurring patterns, but nothing is kept between games; whether and where to keep a record. **Open.**

# Partially answered

* [Q004 — How do we know a comment says nothing false?](/open-questions/Q004-checking-comments-for-false-statements.md) - A code check now discards unsupported claims that a piece on a named square is free; other false statements, and reviews, are still unchecked. **Partial.**

# Closed

_None._

# Related

* [Decisions](/decisions/) — where resolved questions land.
* [Overview](/overview.md) — what this project is.
* [Conventions](/conventions.md) — the Q-ID frontmatter and closure shapes.
