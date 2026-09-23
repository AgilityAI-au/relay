# Tasks — Start a new project

**10 active**. Completed work is in TASKS-DONE.md.

Each block below is one story. Edit them here by hand, or open this folder in
the board. How work moves between states is in AGENTS.md.

---
id: S-001
title: Say what this project is, in one paragraph
stage: plan
state: todo
actor: Human
priority: P0
epic: Project Setup
feature: Discovery
work_type: business
increment: PI-1
rev: 1
---

## Goal
One paragraph, in your own words, describing what you are trying to make or find out.

## Scope
1. Write it badly first — clarity comes from editing, not from waiting
2. Say who it is for
3. Say what "finished" would look like

## Acceptance Criteria
1. A paragraph exists in README.md
2. Someone who knows nothing about it could repeat it back to you

## Notes
Start here. Do not open the AI yet — this is the one story where your own words
matter more than a good draft. Two or three sentences is enough.

---
id: S-002
title: Have the AI sharpen the problem statement
stage: plan
state: todo
actor: AI
priority: P0
epic: Project Setup
feature: Discovery
work_type: business
increment: PI-1
rev: 1
depends_on: [S-001]
tools: [claude-code]
---

## Goal
A problem statement that names who has the problem, what it costs them, and how
you would know it was solved.

## Scope
1. Read the paragraph from S-001
2. Ask up to five clarifying questions — do not guess
3. Rewrite README.md with the sharpened statement

## Acceptance Criteria
1. README.md names the audience explicitly
2. It says what success looks like in observable terms
3. Nothing has been invented that the human did not say

## Notes
The third criterion is the important one. An AI that fills gaps with plausible
detail produces a document you cannot trust. Questions are better than guesses.

---
id: S-003
title: Name what is explicitly OUT of scope
stage: plan
state: todo
actor: Human
priority: P0
epic: Project Setup
feature: Discovery
work_type: business
increment: PI-1
rev: 1
depends_on: [S-002]
---

## Goal
A written list of what this project is deliberately not doing.

## Acceptance Criteria
1. README.md has an "Out of scope" section with at least three entries
2. Each has a one-line reason
3. The first entry is recorded in DECISIONS.md with an impact of scope

## Notes
This is the single highest-value document in any project. Scope you have not
excluded in writing is scope you have implicitly accepted.

---
id: S-004
title: Ask the AI for two or three approaches, with trade-offs
stage: plan
state: todo
actor: AI
priority: P1
epic: Project Setup
feature: Design
work_type: business
increment: PI-1
rev: 1
depends_on: [S-003]
tools: [claude-code]
---

## Goal
Real alternatives with honest trade-offs — not one recommendation dressed up as a choice.

## Scope
1. Propose two or three genuinely different approaches
2. For each: what it costs, what it risks, what it rules out later
3. State a recommendation and say why

## Acceptance Criteria
1. Each option has a stated downside
2. The recommendation explains what it trades away
3. Options that were considered and dismissed are named

## Notes
If every option sounds good, the list is not honest. Push back and ask what each
one costs.

---
id: S-005
title: Choose an approach and record why
stage: plan
state: todo
actor: Human
priority: P0
epic: Project Setup
feature: Design
work_type: business
increment: PI-1
rev: 1
depends_on: [S-004]
---

## Goal
A decision, written down, that you can defend in three months when you have
forgotten the reasoning.

## Acceptance Criteria
1. DECISIONS.md carries the decision with an impact of timeline, scope, risk or commercial
2. The reason is one line, not one page
3. The rejected options are named

## Notes
The AI can draft this. The choice is yours — that is the whole point of the
handoff.

---
id: S-006
title: Write the design specification
stage: plan
state: todo
actor: AI
priority: P1
epic: Project Setup
feature: Design
work_type: business
increment: PI-1
rev: 1
depends_on: [S-005]
tools: [claude-code]
---

## Goal
DESIGN.md — how it behaves and why, in enough detail to argue with.

## Acceptance Criteria
1. Describes behaviour, not implementation
2. Every choice traces back to README.md or a decision
3. Open questions are listed as open, not quietly resolved

## Notes
A design document that has no open questions is usually hiding them.

---
id: S-007
title: Write the rules the AI follows here
stage: plan
state: todo
actor: AI
priority: P1
epic: Project Setup
feature: Governance
work_type: enabler
increment: PI-1
rev: 1
depends_on: [S-006]
tools: [claude-code]
---

## Goal
AGENTS.md — the contract. How work is found, done, recorded and handed back.

## Scope
1. Where work lives and how to find it without reading everything
2. What "done" means, and who decides
3. What the AI must never do without asking

## Acceptance Criteria
1. An AI reading only this file could pick up work correctly
2. It states that a human accepts work, not the AI
3. It says what is generated and must never be hand-edited

## Notes
Copy the starting version from templates/AGENTS.md and adapt it. Do not write
this from scratch.

---
id: S-008
title: Write the working context and house rules
stage: plan
state: todo
actor: AI
priority: P2
epic: Project Setup
feature: Governance
work_type: enabler
increment: PI-1
rev: 1
depends_on: [S-007]
tools: [claude-code]
---

## Goal
CLAUDE.md — constraints, house rules, and where the project currently stands.

## Acceptance Criteria
1. Lists the constraints that are non-negotiable, with reasons
2. Says what is done and what is next
3. Short enough that it is actually read

## Notes
The reasons matter more than the rules. A rule without a reason gets "improved"
away by the next person or model that reads it.

---
id: S-009
title: Decide what "done" means on this project
stage: plan
state: todo
actor: Human
priority: P1
epic: Project Setup
feature: Governance
work_type: business
increment: PI-1
rev: 1
---

## Goal
A definition of done you will actually apply, not one you will quietly skip.

## Acceptance Criteria
1. Written into AGENTS.md
2. Says what evidence is required — not just "it works"
3. Names who accepts

## Notes
Three or four lines. A definition of done nobody can remember is not one.

---
id: S-010
title: Break the first slice into stories
stage: build
state: todo
actor: Human
priority: P0
epic: Project Setup
feature: Discovery
work_type: business
increment: PI-1
rev: 1
depends_on: [S-006, S-009]
---

## Goal
The smallest slice that produces something real, broken into stories you can start.

## Scope
1. Pick the thinnest end-to-end slice
2. Write one story per deliverable
3. Set who does each — you or the AI

## Acceptance Criteria
1. At least three stories exist with goals and acceptance criteria
2. Each is small enough to finish in about a day
3. Every story has an actor

## Notes
When this is done, the setup Epic is finished and the project is genuinely
underway. Archive these setup stories and work your own backlog.
