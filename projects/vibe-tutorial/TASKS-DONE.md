# Completed — Vibe coding: a tutorial

6 finished stories. Kept for the record; nothing here needs reading
to do today's work.

Active work is in TASKS.md.

---
id: T-001
title: Pick something small you actually want
stage: plan
state: done
actor: Human
priority: P0
epic: Learning the loop
feature: Set Up
work_type: business
increment: Session 1
rev: 1
---

## Goal
One thing you would genuinely use, small enough to finish in a weekend.

## Acceptance Criteria
1. You can describe it in one sentence
2. You would use it yourself, at least once a week
3. It is small enough that "finished" is imaginable

## Test Log
- r1 · 2026-08-08 · pass · review · Human · picked, and cut down twice

## Notes
Not a to-do app, and not whatever a tutorial told you to build. Motivation is the
scarce resource here, and you only get it from wanting the thing. Everything after
this is easier if this one is honest.

---
id: T-002
title: Choose your AI tool and install it
stage: plan
state: done
actor: Human
priority: P0
epic: Learning the loop
feature: Set Up
work_type: enabler
increment: Session 1
rev: 1
---

## Goal
An AI that can read and write files in a folder on your computer.

## Scope
1. Pick one — you can change later
2. Install it
3. Check it can see a file you created

## Acceptance Criteria
1. The tool is installed and signed in
2. It can read a file you made and tell you what is in it

## Test Log
- r1 · 2026-08-08 · pass · manual · Human · asked it to read a file, it could

## Notes
Two routes worth knowing. **VS Code plus an extension** — search the marketplace for
"Claude Code" (Anthropic) or "Codex" (OpenAI), both first-party, one click. The chat
sits beside your files, which is the clearest way to see what is happening.
**Or the vendor's own app** — create a *local* project and point it at your folder;
a cloud project cannot write to your disk.

Plans change often. At the time of writing Codex has a free tier and Claude Code
needs a paid plan. Check before you spend anything.

---
id: T-003
title: Make a folder and open it in both places
stage: plan
state: done
actor: Human
priority: P0
epic: Learning the loop
feature: Set Up
work_type: enabler
increment: Session 1
rev: 1
depends_on: [T-002]
---

## Goal
One folder, open in your AI tool and in this board at the same time.

## Acceptance Criteria
1. The AI can list what is in the folder
2. The board shows the same stories when you click Open

## Notes
This is the whole integration. There is no API and nothing to connect — you both
read and write the same files. When the AI edits a story, the board shows it.

---
id: T-004
title: Ask for the smallest thing that runs
stage: build
state: done
actor: AI
priority: P0
epic: Learning the loop
feature: First Build
work_type: business
increment: Session 1
rev: 2
depends_on: [T-003]
tools: [ai-assistant]
---

## Goal
Something that starts, that you can look at. Not the app — just proof the loop works.

## Acceptance Criteria
1. It runs without errors
2. The command to run it is written down
3. You committed it before doing anything else

## Test Log
- r1 · 2026-08-09 · fail · manual · Human · it ran, but nowhere said how to start it
- r2 · 2026-08-09 · pass · manual · Human · instructions added, clean start from scratch

## Notes
Resist describing the whole app in your first message. A small ask you can verify
beats a big one you cannot. Criterion 2 exists because "it worked on my machine an
hour ago" is not a state you can return to.

---
id: T-004a
title: Write down how to start it
stage: build
state: done
actor: AI
priority: P2
epic: Learning the loop
feature: First Build
work_type: chore
increment: Session 1
rev: 1
parent: T-004
tools: [ai-assistant]
---

## Goal
A stranger — including you in a fortnight — can start it from the README.

## Acceptance Criteria
1. Every command needed, in order
2. Checked by following it yourself

## Test Log
- r1 · 2026-08-09 · pass · manual · Human · followed it from scratch, worked

---
id: T-008
title: Commit before you experiment
stage: build
state: done
actor: Human
priority: P0
epic: Habits and finishing
feature: Habits That Save You
work_type: enabler
increment: Session 1
rev: 1
decisions: [D-001]
---

## Goal
Every risky change starts from a clean, saved state you can get back to.

## Acceptance Criteria
1. You know how to save a checkpoint
2. You have gone back to one at least once, on purpose

## Test Log
- r1 · 2026-08-10 · pass · manual · Human · broke it deliberately, got back

## Notes
The single habit that separates "try it and see" being fun from being frightening.
It also changes how you work with an AI: you can let it attempt something ambitious,
because the cost of it going wrong is thirty seconds.
