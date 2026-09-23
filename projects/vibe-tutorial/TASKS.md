# Tasks — Vibe coding: a tutorial

**12 active** · 1 blocked · 2 parked. Completed work is in TASKS-DONE.md.

Each block below is one story. Edit them here by hand, or open this folder in
the board. How work moves between states is in AGENTS.md.

---
id: T-005
title: Use it for ten minutes and write down what is wrong
stage: build
state: doing
actor: Human
priority: P1
epic: Learning the loop
feature: First Build
work_type: chore
increment: Session 1
rev: 1
depends_on: [T-004]
---

## Goal
A specific list of what annoys you, written while you are actually using the thing.

## Acceptance Criteria
1. At least five complaints, each specific enough to fix
2. No entry that just says it looks bad

## Notes
The step everyone skips, and the one that decides whether the thing is pleasant.
Your AI cannot do it — it has not felt the annoyance. Ten minutes of real use beats
an hour of guessing at improvements.

---
id: T-006
title: Fix one thing at a time
stage: build
state: review
actor: Human
priority: P0
epic: Learning the loop
feature: First Build
work_type: business
increment: Session 2
rev: 3
depends_on: [T-005]
tools: [ai-assistant]
wsjf_bv: 13
wsjf_tc: 8
wsjf_rr: 5
wsjf_size: 3
---

## Goal
Work the list from the top, one change per request, checking after each.

## Scope
1. One complaint per message
2. Look at the result before asking for the next
3. Commit anything that works

## Acceptance Criteria
1. Each change was checked before the next was asked for
2. Nothing else broke
3. Anything you could not fix went back on the list

## Test Log
- r1 · 2026-08-11 · pass · manual · Human · first three fixed cleanly
- r2 · 2026-08-12 · pass · manual · Human · next two fixed

## Notes
Criterion 3 was added at r3, after two fixes quietly got dropped instead of being
recorded. The r2 pass came before that criterion existed, which is why this shows
as **stale** rather than verified — the old check no longer covers what is being
asked. That marker is the single most useful thing on this board.

Asking for five changes at once feels faster and is not: when something breaks you
have no idea which one did it.

---
id: T-007
title: Add the one feature you actually wanted
stage: build
state: todo
actor: AI
priority: P0
epic: Learning the loop
feature: First Build
work_type: business
increment: Session 2
rev: 1
hold: blocked
depends_on: [T-006]
tools: [ai-assistant]
wsjf_bv: 13
wsjf_tc: 5
wsjf_rr: 3
wsjf_size: 5
---

## Goal
The thing from T-001 that made you want to build this at all.

## Acceptance Criteria
1. You can do the thing you originally wanted
2. It survives being used twice

## Notes
Blocked until the annoyances are fixed — building on top of something irritating
just gives you more of it. Blocked is a fact worth showing, not a failure.

---
id: T-009
title: Read the change, not just the result
stage: build
state: todo
actor: Human
priority: P1
epic: Habits and finishing
feature: Habits That Save You
work_type: chore
increment: Session 2
rev: 1
---

## Goal
You know roughly what changed, every time, before you accept it.

## Acceptance Criteria
1. You looked at what was edited, not only whether it worked
2. You asked about at least one thing you did not understand

## Notes
Not every line. Enough to know what moved. Approving work you have not looked at is
how a project stops being yours — and it is how small mistakes survive long enough
to become confusing ones.

---
id: T-010
title: Write down what you tested
stage: build
state: todo
actor: AI
priority: P1
epic: Habits and finishing
feature: Habits That Save You
work_type: chore
increment: Session 2
rev: 1
tools: [ai-assistant]
---

## Goal
Every story carries a dated line saying what was checked and whether it passed.

## Acceptance Criteria
1. A Test Log entry exists for each story marked done
2. Each says how it was checked, not just that it was

## Notes
This is where the board earns its keep. "It works" is not evidence. A dated line at
a known revision is — and when the story later changes, that evidence is
automatically marked stale instead of quietly going out of date.

---
id: T-011
title: Ask the AI what it is unsure about
stage: build
state: todo
actor: Human
priority: P2
epic: Habits and finishing
feature: Habits That Save You
work_type: chore
increment: Session 2
rev: 1
---

## Goal
A habit of asking, so confidence stops being a useless signal.

## Acceptance Criteria
1. You asked "what are you least sure about here?" at least three times
2. You checked one of the answers

## Notes
When an AI is guessing, the code looks exactly as confident as when it is not. You
cannot tell by reading. You can, quite reliably, by asking.

---
id: T-012
title: Decide what you are not building
stage: plan
state: todo
actor: Human
priority: P1
epic: Habits and finishing
feature: Finishing
work_type: business
increment: Session 2
rev: 1
---

## Goal
A written list of what this deliberately does not do.

## Acceptance Criteria
1. At least three things named, each with a one-line reason
2. Anything cut is parked as a story, not deleted

## Notes
An AI will cheerfully build anything you mention, which makes scope easier to lose
than it has ever been. Scope you have not excluded in writing is scope you have
accidentally accepted.

---
id: T-013
title: Show it to one person
stage: build
state: todo
actor: Human
priority: P0
epic: Habits and finishing
feature: Finishing
work_type: business
increment: Session 2
rev: 1
depends_on: [T-007]
wsjf_bv: 13
wsjf_tc: 13
wsjf_rr: 5
wsjf_size: 2
---

## Goal
One real person, who is not you, has used it and said something.

## Acceptance Criteria
1. Someone else has it in front of them
2. Their first reaction is written down

## Notes
Highest priority on the board and the story most likely to be quietly postponed
forever. Showing one person is what turns a project into a thing.

---
id: T-014
title: Set your next project up properly
stage: plan
state: todo
actor: Human
priority: P1
epic: Habits and finishing
feature: Finishing
work_type: business
increment: Later
rev: 1
depends_on: [T-013]
---

## Goal
Start the next one with the documents and habits this one taught you.

## Acceptance Criteria
1. A new folder with its own AGENTS.md and a real backlog
2. You wrote down at least one thing you would do differently

## Notes
Switch this board to **Start a new project** for a backlog that walks you through it.
That seed exists because doing the setup properly is itself a small project.

---
id: T-017
title: Write AGENTS.md and CLAUDE.md
stage: plan
state: doing
actor: Both
priority: P0
epic: Habits and finishing
feature: Write It Down
work_type: enabler
increment: Session 1
rev: 1
---

## Goal
Two files that let any AI — or you in a fortnight — pick this up without the chat history.

## Scope
1. AGENTS.md: a short pointer. How work is found, what done means, who decides.
2. CLAUDE.md: the actual context. Constraints with their reasons, house rules, where things stand.
3. AGENTS.md ends by pointing at CLAUDE.md.

## Acceptance Criteria
1. AGENTS.md is short and says a person accepts work, never the AI
2. AGENTS.md points to CLAUDE.md for context and house rules
3. CLAUDE.md says to check, at the start of a session, that these files still describe reality
4. A fresh chat with no history can start work from these two files alone

## Notes
**Marked Both because it is a conversation, not a task.** You steer, the AI writes, and it
is never quite finished — but it *does* complete: the first version exists, AGENTS points at
CLAUDE, and CLAUDE carries the instruction to keep checking.

**Do this five to ten messages in.** Earlier and you are documenting a project you have not
understood yet. Later and the context only lives in a thread nobody will re-read.

**Why two files.** AGENTS.md is read by every assistant — Claude, Codex, whatever is next —
so it stays short and tool-neutral. CLAUDE.md carries the weight. A long AGENTS.md becomes a
manual written for whichever tool you happened to use first.

See **AI-HUMAN-WAYS-OF-WORKING.md** in this folder for the full version.

---
id: T-018
title: Split anything big out of CLAUDE.md
stage: plan
state: todo
actor: Both
priority: P1
epic: Habits and finishing
feature: Write It Down
work_type: enabler
increment: Session 2
rev: 1
depends_on: [T-017]
---

## Goal
CLAUDE.md stays a map. Anything that grows into a subject gets its own file.

## Scope
1. Notice which section is taking over
2. Move it out, leave a one-line pointer

## Acceptance Criteria
1. CLAUDE.md is short enough that you would actually read it
2. Each split-out file is named for its subject
3. CLAUDE.md links to each

## Notes
Split rather than scroll. A file too long to read stops being read — by people, and by
models, which skim it or drop it from context entirely.

Usual candidates: **DESIGN.md** when behaviour and reasoning take over · **DATA-MODEL.md**
when you describe the same entities twice · **ARCHITECTURE.md** when technology choices need
their own argument · **ROADMAP.md** when you keep saying "not yet" and want to remember why.

---
id: T-019
title: Start a decision log
stage: plan
state: todo
actor: Both
priority: P1
epic: Habits and finishing
feature: Write It Down
work_type: enabler
increment: Session 2
rev: 1
depends_on: [T-017]
---

## Goal
DECISIONS.md, with a gate strict enough that it stays worth reading.

## Acceptance Criteria
1. Every entry names an impact: timeline, scope, risk or cost
2. Every entry says what was rejected, not only what was chosen
3. At least one real decision from this project is in it

## Notes
Record a decision only if it changed the timeline, the scope, the risk or the cost. **If you
cannot pick one of those four, it is a note on a story, not a decision.**

That one rule is what keeps the log thin. A big unorganised decision log is worse than none —
nobody opens it, so nothing is protected by it.

The AI can draft the entry. The choice is yours; that is the whole point of writing it down.

---
id: T-020
title: Check the files still describe reality
stage: plan
state: todo
actor: Both
priority: P2
epic: Habits and finishing
feature: Write It Down
work_type: chore
increment: Session 2
rev: 1
depends_on: [T-017]
---

## Goal
A habit, not a task: the documents keep matching the project.

## Acceptance Criteria
1. You have asked for this check at least once and something was actually out of date
2. CLAUDE.md carries the instruction, so you do not have to remember it

## Notes
Documents rot silently, and an AI reading a stale CLAUDE.md will confidently follow rules
that no longer apply — which is worse than having no rules.

A prompt that works: *"Read AGENTS.md and CLAUDE.md, then tell me which parts no longer match
what is actually here."*

The real test: **could a fresh session, with no history, pick this up from the files alone?**
Whatever it could not is the thing to write down.

---
id: T-015
title: Add automated tests
stage: build
state: todo
actor: AI
priority: P2
epic: Habits and finishing
feature: Finishing
work_type: enabler
increment: Later
rev: 1
hold: deferred
defer_reason: size
revisit_trigger: when you break the same thing twice
---

## Goal
Checks that run themselves, so you stop re-testing by hand.

## Notes
Worth doing, and its own piece of work. Parked on size, not on doubt. The revisit
trigger is honest: breaking the same thing twice is the moment manual checking has
actually cost you more than writing the test would have.

---
id: T-016
title: Make it look good
stage: build
state: todo
actor: AI
priority: P2
epic: Habits and finishing
feature: Finishing
work_type: chore
increment: Later
rev: 1
hold: deferred
defer_reason: value
revisit_trigger: after someone other than you has used it
---

## Goal
Spacing, type and colour that you enjoy looking at.

## Notes
Parked on value rather than effort. Polishing something whose behaviour may still
change is work you will do twice — and until a second person has used it you do not
yet know which parts deserve the attention.
