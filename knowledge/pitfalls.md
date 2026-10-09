---
type: Invariant
title: "Pitfalls & invariants"
description: Load-bearing constraints in chess_coach that fail quietly when broken by accident — each stated as what must hold, why, and the evidence.
tags: [invariant, pitfalls, doc-drift]
generated: { by: human:jason-roche, at: 2026-10-09T00:00:00Z }
stale_after: 2027-01-07T00:00:00Z
---

The things that took real work to discover and are easy to undo with a casual
edit. Each is stated as an **invariant**: what must hold, why it must hold, and
the evidence that established it.

This concept starts as a single file. It splits into a directory only if it
outgrows one — and the trigger for that is genuine difficulty finding an
invariant, not file length alone.

**What belongs here:** a constraint whose violation fails *quietly*. If breaking
it produces a loud, obvious error, the error is the documentation and this file
doesn't need an entry. The entries worth writing are the ones where the system
keeps running and the results are silently wrong.

# Doc-drift invariant: verify version-sensitive claims against code/binary

**Invariant:** every claim about a moving value — a dependency version, a model
id, a record count, a file location, a tool's behaviour — must be verified
against the code or the binary before it is written down, and stated with an
explicit "as of YYYY-MM-DD". Do not carry such a claim forward from prose alone.

**Why:** prose copies faster than reality changes, and a claim repeated across
three documents looks like corroboration when it is one unverified statement
cited three times. The failure is quiet by construction — nothing errors, the
sentence simply stops being true, and the next reader inherits it as fact.

**Evidence:** this invariant is seeded from the project-bootstrap standard rather
than discovered here. The reference implementation it comes from found nine
distinct drifted claims in a single documentation inventory — including a tool's
command-line interface described in terms of a flag it does not accept, and a
component documented as "not yet built" that had been in production for weeks.
Every one of them read as settled fact.

**How to hold it:** when writing a version-sensitive claim, run the command that
proves it and paste the real value with today's date. When reading one older than
a few weeks, treat it as a hypothesis.

# _TODO: project-specific invariants_

_Add entries as they are discovered — one heading each, in the shape above:
what must hold, why, the evidence that established it. Good candidates: an
environment variable that silently routes work somewhere unintended; a module
that looks dead but is on a live path; a data file that must not be edited in
place; a resource ceiling that degrades rather than errors when crossed._

_Delete this placeholder once the first real entry lands._

# Related

- [Conventions — the as-of-date rule](/conventions.md)
- [Overview](/overview.md)
- [Decisions](/decisions/) — several invariants exist because of a decision;
  link them to each other when they do.
