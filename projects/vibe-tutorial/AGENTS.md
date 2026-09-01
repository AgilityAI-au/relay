# AGENTS.md — the contract

## Finding work

1. Read tasks/INDEX.md, Active section only.
2. Pick state todo, no hold, all depends_on **done**.
3. Read that one story file — not the whole folder.

A dependency sitting in review is **not** done. It means a person has not looked yet.

## Doing it

- Set state doing and actor AI when you start.
- Build only what the Acceptance Criteria ask for. If they are wrong, say so and stop —
  do not quietly build something better.
- Commit working code before starting anything risky.

## Recording it

Append a line inside the Test Log section. Never edit or remove an existing line:

- r3 · 2026-09-01 · pass · manual · AI · what you checked

If you changed the Goal, Scope or Acceptance Criteria, **add 1 to rev first**. That marks
earlier results stale, which is correct and is the point.

## Handing back

Finish at state review, actor Human. **Stop there.**

## Never

- Write tasks/INDEX.md by hand — it is generated.
- Mark a story done.
- Commit unless asked.
