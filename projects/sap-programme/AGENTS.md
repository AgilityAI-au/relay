# AGENTS.md — how AI works on this programme

## Finding work

1. Read tasks/INDEX.md. Do not read the whole folder.
2. Pick a story with state todo, no hold, and all depends_on **done**.
3. Read that one story file.

## Working

- Set state doing and actor AI when you start.
- Append to the Test Log. Never edit or delete an entry.
- If you change Goal, Scope or Acceptance Criteria, bump rev.
- Finish at state review, actor Human. **A human accepts, not you.**

## Programme rules

| Rule | Why |
|---|---|
| Standard before custom | Every deviation from standard S/4HANA needs a written decision. |
| No configuration without a signed design | The rationale document is the audit trail. |
| Business owns master data | The AI may propose merges; Procurement approves them. |
| A dependency in review is not met | Only done counts. |
