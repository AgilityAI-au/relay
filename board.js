/* =============================================================================
   Relay — plan and run work with AI and people on the same board
   (build: kanban-4)
   -----------------------------------------------------------------------------
   Architecture (see CLAUDE.md "Keep the render layer disciplined"):

     parse  →  state.tickets  →  derive()  →  render()

   * ONE delegated listener per event type on document. No per-element binding.
   * ONE render() entry point. Sub-renderers return strings; nothing else
     touches the DOM.
   * Everything computable is derived, never stored (DATA-MODEL.md §6.3).

   Vocabulary is SAFe / JIRA / Azure DevOps aligned:
     Epic → Feature → Story → Task
   A ticket with no parent is a Story; with a parent it is a Task. Epic and
   Feature are grouping labels, not separate records — nothing extra to author.
   ========================================================================== */

'use strict';

/* ---------------------------------------------------------------- constants */

const STATES = [
  { id: 'todo',   label: 'To Do',       sub: 'Ready to pull — nothing blocking it' },
  { id: 'doing',  label: 'In Progress', sub: 'Work in flight right now' },
  { id: 'review', label: 'Review',      sub: 'Claimed done — not yet accepted by a human' },
  { id: 'done',   label: 'Done',        sub: 'Accepted against its criteria' }
];

const STAGES = [
  { id: 'plan',  label: 'Plan',  sub: 'Analysis, architecture, decisions' },
  { id: 'build', label: 'Build', sub: 'Implementation and validation' }
];

/* `Both` is for work that is a conversation rather than a task — the human steers,
   the AI writes, and it is never really finished. It always needs a person, so it
   never counts as ready-to-dispatch. */
const ACTORS = [{ id: 'AI', label: 'AI' }, { id: 'Human', label: 'Human' }, { id: 'Both', label: 'Both' }];

/* SAFe splits work by the kind of value it delivers: business value now, or
   architectural runway that enables value later. */
const WORK_TYPES = ['business', 'enabler', 'bug', 'chore'];

const DEFER_REASONS = {
  complexity: 'Not understood well enough yet',
  size:       'Understood, too big for this increment',
  risk:       'Could break something that works',
  value:      'Cost / benefit not demonstrated',
  dependency: 'Waiting on something external'
};

/* Modified Fibonacci, as SAFe uses for WSJF scoring. */
const FIB = [1, 2, 3, 5, 8, 13, 20];

const TODAY = () => new Date().toISOString().slice(0, 10);

/* --------------------------------------------------------------- about doc
   Ships with the board rather than living in any project folder, so it is
   present whatever you open — including a folder with no readme of its own.

   It never collides with a project's own README.md: that stays the project's,
   and on GitHub it stays the landing page. Hide this one in Settings once you
   no longer need it. */

const ABOUT_KEY = '__about__';

const ABOUT_DOC = `# About Relay

**Plan and run work with AI and people on the same board.**

AI runs a leg, you run a leg, and the handover is on the board where everyone can see it.

Stories are ordinary Markdown files in a folder. This board reads and writes those same
files — so does your AI. Nothing else sits in between.

> This is a working demonstration of an idea, not a finished product. It does real work; it
> is here to show a direction.

---

## The five things you actually do

1. **Make a folder** — one place on your computer for this piece of work.
2. **Put the starter files in it** — a few Markdown files and a \`tasks\` folder.
3. **Pick your AI and point it at the folder.**
4. **Talk about the work** — the chat is where the thinking happens; the AI writes it down.
5. **Watch the board** — where the work becomes visible and reviewable.

---

## Four ways to use it

| | What you need | What you get |
|---|---|---|
| **Look** | This page | Sample projects, already loaded. Everything moves — nothing here is a screenshot. |
| **Use** | Chrome, Edge or Arc | Click **Open**, choose a folder, edit stories and save them back. |
| **Ask an AI** | Any chat, including free accounts | Select a story, click **Ask an AI**. The board writes the prompt; you carry it to ChatGPT, Claude or Gemini and paste the reply back. |
| **Connected** | An AI with folder access | It edits the files directly and the board shows the result. |

**Opening a folder needs a Chromium browser** — Chrome, Edge, Arc or Brave. Safari and
Firefox can read this page and the samples but cannot open a folder.

---

## Reading the board

- **Four columns** — To Do, In Progress, Review, Done. *Review* means the work is claimed
  done but a person has not agreed yet.
- **Lanes** split the same cards a second way. Switch to **Actor** and you see AI work and
  human work side by side. Press **L** to cycle.
- **⇄ needs you** means a story is waiting on a person. That is the handover.
- **⚠ stale** means the story changed after it was last tested, so the old result no longer
  covers it. Treat it as untested.
- **Drag a card** to move it. Across a lane boundary it moves both things at once — drag
  between actor lanes and you have performed the handover.

**Plan** shows the same work as rows against increments — a plan on a page zoomed out, a
Gantt zoomed in. **Docs** shows the project's own documents and which expected ones are
missing.

---

## What the files are for

| File | Why it exists |
|---|---|
| \`tasks/\` | One story per file. Small, reviewable, and readable without any tool. |
| \`tasks/INDEX.md\` | Generated. One row per story so an AI can find work without reading every file. Never edit it by hand. |
| \`AGENTS.md\` | The rules an AI follows here — how to find work, what "done" means, what it must not do. |
| \`CLAUDE.md\` | Working context and house rules, with the reasons behind them. |
| \`DECISIONS.md\` | Decisions that changed the timeline, the scope, the risk or the cost. Nothing else. |

---

## Why a board at all

A list of tasks is a record. This is meant to be the opposite: a place where **work is
handed back and forth** and both sides can see the state of it.

When an AI does much of the building, the human job shifts to deciding and reviewing — and
that needs a surface. Familiar columns and lanes mean nobody has to learn a method before
they can start, and the vocabulary maps onto SAFe, Azure DevOps and SAP Activate, so it fits
alongside whatever a team already runs.

---

## What it is not

No accounts. No server. No database. Nothing is uploaded — the board makes no network calls
at all after this page loads, and you can confirm that in your browser's developer tools.
It is single-user today, and there is no automated connection to an AI: you or your AI tool
move the work.

---

## Handy

**/** search · **L** lanes · **D** density · **⌘S** save · **Esc** close

*Hide this page: **Settings → Project → Show the About page**.*
`;

/* The documents a project is expected to carry. `required` ones are the spine:
   what it is, how AI works here, how it is built, and what was decided.
   The board reports which are missing — a project health check, not just a viewer. */
const DOC_SLOTS = [
  { group: 'Orientation', file: 'README.md',       required: true,
    why: 'What this project is, in terms a newcomer understands.' },
  { group: 'Orientation', file: 'ROADMAP.md',
    why: 'Where it is heading, and in what order.' },
  { group: 'Governance',  file: 'AGENTS.md',       required: true,
    why: 'The contract AI agents follow — folder layout, field model, working rules.' },
  { group: 'Governance',  file: 'AI-HUMAN-WAYS-OF-WORKING.md',
    why: 'How to work with an AI so the project survives the chat window.' },
  { group: 'Governance',  file: 'CLAUDE.md',       required: true,
    why: 'How to work on this repo: constraints, house rules, current state.' },
  { group: 'Design',      file: 'DESIGN.md',       required: true,
    why: 'How it behaves and why — the specification worth arguing with.' },
  { group: 'Design',      file: 'ARCHITECTURE.md',
    why: 'Technology choices and the shape of the system.' },
  { group: 'Design',      file: 'DATA-MODEL.md',
    why: 'Entities, fields and relationships, independent of storage.' },
  { group: 'Decisions',   file: 'DECISIONS.md',    required: true,
    why: 'Decisions that moved timeline, scope, risk or commercials.' }
];

/* Short stand-ins so the Docs view is populated in the showcase. Open a real
   folder and these are replaced by that project's actual files. */
const DEMO_DOCS = {
'README.md': `# Customer Portal

A self-service portal so customers can see their own account without phoning us.

## Why

Around 40% of inbound support calls are people asking questions they could answer
themselves. Phase 1 targets the top three.

## Phase 1 scope

- Sign in with corporate identity (SSO)
- View and edit your own profile
- See a dashboard of account status

Reporting is **out of scope** for phase 1 — see \`DECISIONS.md\` D-001.

## How work is tracked

Stories live one-per-file in \`tasks/\`, grouped into Features and Epics. The board
reads the same folder an AI agent does, so both see one source of truth.`,

'AGENTS.md': `# AGENTS.md — how AI works on this project

> This is the contract. The board and any AI agent both read this file.

## Finding work

1. Read \`tasks/INDEX.md\` — one row per story, cheap to load.
2. Pick a story with \`state: todo\`, no \`hold\`, and all \`depends_on\` **done**.
3. Read that one story file. Do not read the whole folder.

## Working

- Set \`state: doing\` and \`actor: AI\` when you start.
- Append to the Test Log — never edit or delete an existing entry.
- If you change the Goal, Scope or Acceptance Criteria, **bump \`rev\`**.
- Finish at \`state: review\`, \`actor: Human\`. Stop there. A human accepts, not you.

## Rules

| Rule | Why |
|---|---|
| Never write \`INDEX.md\` | It is generated. Regenerate it instead. |
| A dependency in \`review\` is not met | Only \`done\` counts — a human has not agreed yet. |
| Nothing auto-commits | The human is always the gate. |`,

'CLAUDE.md': `# CLAUDE.md — working context

## What this is

The customer portal. See \`README.md\` for scope.

## House rules

### Small stories
If a story needs more than about a day, split it into Tasks under a parent.

### Write the test down
Every story carries a Test Log. "It works" is not evidence — a dated entry at a
known revision is.

### Ask before widening scope
Scope changes are decisions. If it affects timeline, scope, risk or commercials,
it belongs in \`DECISIONS.md\` before the code changes.

## Current state

Phase 1, PI-2. Authentication is nearly complete; the dashboard is blocked on a
brand palette decision that only a human can make.`,

'DECISIONS.md': `# Decisions

Only decisions with an **impact** of timeline, scope, risk or commercial belong
here. If you cannot pick one of those four, it is a note on the story, not a
decision.

### D-001 · Reporting is out of scope for phase 1
- 2026-07-09 · decided · scope
- Why: no reporting sponsor has been named, so any KPI set agreed now would be
  re-agreed later. Parked, not cancelled — see T-013.

### D-002 · Use the corporate SSO provider rather than building sign-in
- 2026-07-14 · decided · risk
- Why: password handling is a liability we do not need. Costs a dependency on
  the identity team's release calendar, which is accepted.

### D-003 · Dashboard build waits on the brand palette
- 2026-08-26 · decided · timeline
- Why: rebuilding components after a palette change costs more than the wait.
  T-010 is explicitly blocked by T-008.`
};


/* ------------------------------------------------------------- vibe seed
   A tutorial, not an example. The stories ARE the steps of learning to build
   something with an AI — so working this board teaches both the craft and the
   board at the same time. What you build is deliberately left to the reader:
   a specific app would be somebody else's project. */

const VIBE_SEED = [
`---
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
this is easier if this one is honest.`,

`---
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
needs a paid plan. Check before you spend anything.`,

`---
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
read and write the same files. When the AI edits a story, the board shows it.`,

`---
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
hour ago" is not a state you can return to.`,

`---
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
- r1 · 2026-08-09 · pass · manual · Human · followed it from scratch, worked`,

`---
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
an hour of guessing at improvements.`,

`---
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
have no idea which one did it.`,

`---
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
just gives you more of it. Blocked is a fact worth showing, not a failure.`,

`---
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
because the cost of it going wrong is thirty seconds.`,

`---
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
to become confusing ones.`,

`---
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
automatically marked stale instead of quietly going out of date.`,

`---
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
cannot tell by reading. You can, quite reliably, by asking.`,

`---
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
accidentally accepted.`,

`---
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
forever. Showing one person is what turns a project into a thing.`,

`---
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
That seed exists because doing the setup properly is itself a small project.`,

`---
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

See **AI-HUMAN-WAYS-OF-WORKING.md** in this folder for the full version.`,

`---
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
their own argument · **ROADMAP.md** when you keep saying "not yet" and want to remember why.`,

`---
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

The AI can draft the entry. The choice is yours; that is the whole point of writing it down.`,

`---
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
Whatever it could not is the thing to write down.`,

`---
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
actually cost you more than writing the test would have.`,

`---
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
yet know which parts deserve the attention.`
];

const VIBE_DOCS = {
'README.md': `# Your first build with AI

**A tutorial you work rather than read.** Twenty-one stories that take you from "I want to
make a thing" to "someone else has used it", and teach the habits that make working with
an AI reliable rather than lucky.

What you build is up to you. A specific app would be somebody else's project — the point
is the loop, and the loop is the same whatever you make.

## How to use it

Work the stories roughly in order. The board shows what is ready.

- Stories marked **Human** are yours. Nobody can do T-005 for you — it is ten minutes of
  actually using the thing.
- Stories marked **AI** are for your assistant.
- Watch **T-006**: it is marked *stale*, because its acceptance criteria changed after it
  was last checked. That marker is the most useful idea in this whole board.

## The habits it teaches

0. Write the project files down, five to ten messages in — see **Write It Down**
1. Pick something you actually want
2. Ask small, check, then ask again
3. Commit before you experiment
4. Read the change, not just the result
5. Write down what you tested
6. Ask the AI what it is unsure about
7. Decide what you are *not* building
8. Show it to one person

## When you finish

T-014 hands you on: switch this board to **Start a new project** and set your real one up
with the documents and habits this tutorial taught you.

**AI-HUMAN-WAYS-OF-WORKING.md** in this folder is the long version of the Write It Down
stories — how the files fit together and why each one exists.

> New to the board itself? Open **Docs → About** for what everything means.`,

'CLAUDE.md': `# CLAUDE.md — how I work on this

House rules for me and my AI. Short on purpose — a rule nobody remembers is not a rule.

## The rules

### One thing at a time
One request, one change, one look at the result. Three half-finished changes are worth
less than one that works, and much harder to unpick.

### Commit before you experiment
Every risky change starts clean. This is what makes ambitious attempts cheap.

### Make it work, then make it nice
Do not tune the appearance of something whose behaviour might still change.

### Say "I do not know"
When you are guessing, say so in the notes. Confident-looking wrong answers cost me more
than an honest "I am not sure about this part".

### Stop at review
Set state to review and hand it back. I accept work, not you.

## Where I am

Session 2. The first build runs and the annoyance list is being worked through. Next real
milestone is T-013 — showing it to one person.`,

'AGENTS.md': `# AGENTS.md — the contract

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
- Commit unless asked.`,

'DECISIONS.md': `# Decisions

Only things that changed what gets built, how long it takes, or what could go wrong.
Everything else is a note on a story.

### D-001 · Commit before every experiment
- 2026-08-10 · decided · risk
- Why: nearly lost an hour of working code to a change that went sideways. Costs ten
  seconds; removes the fear that stops you trying ambitious things.

### D-002 · One change per request
- 2026-08-12 · decided · risk
- Why: asked for five fixes at once, two silently did not happen and it took longer to
  work out which than doing them one at a time would have taken in the first place.

### D-003 · What this deliberately will not do
- 2026-08-14 · **open** · scope
- Why: T-012 exists to answer this and has not been done yet. Leaving it open is honest —
  right now the scope of this project is undefined, which is a real risk and not a
  paperwork gap.`
};

/* ------------------------------------------------------------- SAP seed
   A small S/4HANA finance workstream, named the way an SAP PM expects:
   SAP Activate phases, Fit-to-Standard, WRICEF, SIT/UAT, cutover — carried
   on a SAFe Epic → Feature → Story spine. */

const SAP_SEED = [
`---
id: T-001
title: Run Fit-to-Standard workshop — Record to Report
stage: plan
state: done
actor: Human
priority: P0
epic: S/4HANA Core Finance
feature: Fit-to-Standard
work_type: business
increment: PI-1
rev: 1
decisions: [D-001]
---

## Goal
Agree where standard S/4HANA meets the Record to Report process and where it does not.

## Scope
1. Walk the standard process with Finance
2. Log every claimed gap
3. Separate genuine gaps from unfamiliarity

## Acceptance Criteria
1. Every gap logged with a business reason
2. Gaps classified as configuration, WRICEF, or process change

## Test Log
- r1 · 2026-06-18 · pass · review · Human · workshop closed, delta list captured`,

`---
id: T-002
title: Summarise workshop outcomes into a fit-gap delta list
stage: plan
state: done
actor: AI
priority: P0
epic: S/4HANA Core Finance
feature: Fit-to-Standard
work_type: business
increment: PI-1
rev: 1
depends_on: [T-001]
tools: [claude-code]
---

## Goal
One structured delta list the steering committee can actually read.

## Acceptance Criteria
1. Every workshop gap appears exactly once
2. Each carries an impact and a proposed disposition

## Test Log
- r1 · 2026-06-24 · pass · review · Human · reviewed against workshop notes`,

`---
id: T-003
title: Sign off the fit-gap delta list
stage: plan
state: review
actor: Human
priority: P0
epic: S/4HANA Core Finance
feature: Fit-to-Standard
work_type: business
increment: PI-1
rev: 2
depends_on: [T-002]
wsjf_bv: 13
wsjf_tc: 13
wsjf_rr: 8
wsjf_size: 2
---

## Goal
A signed delta list. Nothing downstream can safely start without it.

## Acceptance Criteria
1. Finance lead has signed
2. Every WRICEF candidate has a named owner
3. Deferred gaps carry a phase-2 marker

## Test Log
- r1 · 2026-07-01 · pass · review · Human · signed by Finance lead

## Notes
Criterion 3 was added at r2 after the programme board asked for phase-2 visibility.
The r1 signature predates it — hence the stale marker. Re-sign before Realize.`,

`---
id: T-004
title: Draft configuration rationale — company code structure
stage: build
state: done
actor: AI
priority: P1
epic: S/4HANA Core Finance
feature: Finance Configuration
work_type: business
increment: PI-1
rev: 1
tools: [claude-code]
---

## Goal
Written rationale for the company code and ledger design, for the config team and audit.

## Acceptance Criteria
1. Each design choice traced to a workshop decision
2. Rejected alternatives recorded

## Test Log
- r1 · 2026-07-08 · pass · review · Human · accepted by solution architect`,

`---
id: T-005
title: Configure company codes and chart of accounts
stage: build
state: doing
actor: Human
priority: P0
epic: S/4HANA Core Finance
feature: Finance Configuration
work_type: business
increment: PI-2
rev: 1
depends_on: [T-004]
wsjf_bv: 13
wsjf_tc: 8
wsjf_rr: 5
wsjf_size: 5
---

## Goal
Company codes, ledgers and the chart of accounts configured in the development client.

## Acceptance Criteria
1. Configuration matches the signed design
2. Transport released to QA
3. Config rationale document updated with anything that changed in the build`,

`---
id: T-006
title: Draft data migration mapping — customer master
stage: build
state: todo
actor: AI
priority: P1
epic: Data and Integration
feature: Master Data
work_type: business
increment: PI-2
rev: 1
depends_on: [T-003]
tools: [claude-code]
wsjf_bv: 8
wsjf_tc: 8
wsjf_rr: 3
wsjf_size: 5
---

## Goal
Field-level mapping from the legacy customer master to S/4HANA Business Partner.

## Acceptance Criteria
1. Every target mandatory field has a source or a stated default
2. Unmapped legacy fields listed with a keep-or-drop recommendation`,

`---
id: T-007
title: Cleanse legacy vendor master
stage: build
state: doing
actor: Human
priority: P0
epic: Data and Integration
feature: Master Data
work_type: chore
increment: PI-2
rev: 1
---

## Goal
A vendor master the business will accept as the migration source.

## Acceptance Criteria
1. Duplicates merged and signed off by Procurement
2. Inactive vendors flagged for exclusion

## Notes
Business-owned. The AI can prepare candidate duplicate lists, but only Procurement
can approve a merge.`,

`---
id: T-008
title: Catalogue interfaces in the legacy landscape
stage: plan
state: done
actor: AI
priority: P1
epic: Data and Integration
feature: Integrations
work_type: enabler
increment: PI-1
rev: 1
tools: [claude-code]
---

## Goal
Know every interface in scope before designing any of them.

## Acceptance Criteria
1. Each interface has direction, frequency, volume and business owner
2. Retire / replace / rebuild recommendation for each

## Test Log
- r1 · 2026-07-15 · pass · review · Human · 34 interfaces catalogued`,

`---
id: T-009
title: Draft integration spec — electronic bank statement
stage: build
state: todo
actor: AI
priority: P2
epic: Data and Integration
feature: Integrations
work_type: business
increment: PI-2
rev: 1
hold: blocked
depends_on: [T-008]
tools: [claude-code]
---

## Goal
A build-ready specification for the bank statement inbound interface.

## Acceptance Criteria
1. Format and frequency confirmed with the bank
2. Error and reprocessing behaviour defined

## Notes
Blocked: the bank has not confirmed which statement format they will send.`,

`---
id: T-010
title: Prepare SIT test scripts — Record to Report
stage: build
state: todo
actor: Human
priority: P1
epic: S/4HANA Core Finance
feature: Testing
work_type: business
increment: PI-2
rev: 1
depends_on: [T-005]
---

## Goal
Executable SIT scripts covering the end-to-end R2R process.

## Acceptance Criteria
1. Every in-scope process step has a script
2. Expected results stated before execution`,

`---
id: T-011
title: Generate UAT scenarios from the fit-gap list
stage: build
state: todo
actor: AI
priority: P1
epic: S/4HANA Core Finance
feature: Testing
work_type: business
increment: PI-2
rev: 1
depends_on: [T-003]
tools: [claude-code]
wsjf_bv: 8
wsjf_tc: 5
wsjf_rr: 8
wsjf_size: 3
---

## Goal
Business-readable UAT scenarios traceable back to agreed gaps.

## Acceptance Criteria
1. Every signed gap has at least one scenario
2. Each scenario names the business role who will run it`,

`---
id: T-012
title: Document the authorisation role matrix
stage: build
state: done
actor: AI
priority: P1
epic: S/4HANA Core Finance
feature: Finance Configuration
work_type: enabler
increment: PI-1
rev: 1
tools: [claude-code]
---

## Goal
A role matrix the security team can build from and audit can review.

## Acceptance Criteria
1. Every finance role mapped to transactions and Fiori catalogues
2. Segregation-of-duties conflicts flagged

## Test Log
- r1 · 2026-07-22 · pass · review · Human · reviewed with security lead`,

`---
id: T-013
title: Validate migrated customer master sample
stage: build
state: review
actor: Human
priority: P0
epic: Data and Integration
feature: Master Data
work_type: business
increment: PI-2
rev: 1
depends_on: [T-006]
---

## Goal
Confidence that the mapping produces business-acceptable records.

## Acceptance Criteria
1. 100-record sample reconciled against legacy
2. Every discrepancy explained or raised as a defect

## Test Log
- r1 · 2026-08-25 · pass · manual · Human · sample reconciled, 3 defects raised`,

`---
id: T-014
title: Draft cutover plan and rehearsal schedule
stage: plan
state: todo
actor: Human
priority: P2
epic: Data and Integration
feature: Cutover
work_type: business
increment: PI-3
rev: 1
hold: deferred
defer_reason: dependency
revisit_trigger: once the go-live date is confirmed by the steering committee
---

## Goal
A rehearsed, timed cutover the business has agreed to.

## Notes
Parked on dependency — no confirmed go-live date, so any schedule built now
would be rebuilt.`,

`---
id: T-015
title: Automated data quality dashboard
stage: build
state: todo
actor: AI
priority: P2
epic: Data and Integration
feature: Master Data
work_type: enabler
increment: PI-3
rev: 1
hold: deferred
defer_reason: size
revisit_trigger: after the first successful migration rehearsal
---

## Goal
Continuous visibility of migration data quality rather than point-in-time checks.

## Notes
Understood and wanted, but it is its own build. Parked on size — the manual
reconciliation in T-013 covers the immediate need.`,

`---
id: T-016
title: Confirm scope boundary — no custom code in Finance for phase 1
stage: plan
state: done
actor: Human
priority: P0
epic: S/4HANA Core Finance
feature: Fit-to-Standard
work_type: business
increment: PI-1
rev: 1
decisions: [D-002]
---

## Goal
An agreed, written boundary that keeps the Realize phase from expanding.

## Acceptance Criteria
1. Boundary agreed by the steering committee
2. Exceptions require a written decision

## Test Log
- r1 · 2026-06-30 · pass · review · Human · minuted at steering committee`
];

/* --------------------------------------------------------- bootstrap seed
   "Start a new project." Setting a project up IS a project — so it arrives as
   a backlog you work, not a wizard you click through. Each story produces one
   real file, and the Docs view is the scoreboard. */

const BOOTSTRAP_SEED = [
`---
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
matter more than a good draft. Two or three sentences is enough.`,

`---
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
detail produces a document you cannot trust. Questions are better than guesses.`,

`---
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
excluded in writing is scope you have implicitly accepted.`,

`---
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
one costs.`,

`---
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
handoff.`,

`---
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
A design document that has no open questions is usually hiding them.`,

`---
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
this from scratch.`,

`---
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
away by the next person or model that reads it.`,

`---
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
Three or four lines. A definition of done nobody can remember is not one.`,

`---
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
underway. Archive these setup stories and work your own backlog.`
];


/* ------------------------------------------------------- docs for the seeds */

const SAP_DOCS = {
'README.md': `# S/4HANA Finance — Phase 1

Replacing the legacy finance system with SAP S/4HANA for the Record to Report
process, across four company codes.

## Approach

SAP Activate phases on a SAFe delivery spine. Fit-to-Standard first: we adopt
standard process unless there is a written reason not to.

## Phase 1 scope

- Record to Report end to end
- Customer and vendor master migration
- Electronic bank statement inbound

## Out of scope for phase 1

| Not doing | Why |
|---|---|
| Custom code in Finance | See DECISIONS D-002. Standard-first, exceptions in writing. |
| Procure to Pay | Phase 2. No sponsor named yet. |
| Reporting rebuild | Existing BW reports stay until phase 2. |

## How work is tracked

Stories live one per file, grouped into Features and Epics, planned by Program
Increment. The board and the AI read the same folder.`,

'AGENTS.md': `# AGENTS.md — how AI works on this programme

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
| A dependency in review is not met | Only done counts. |`,

'DECISIONS.md': `# Decisions

Only decisions affecting timeline, scope, risk or commercials belong here.

### D-001 · Adopt standard Record to Report, gaps by exception
- 2026-06-18 · decided · scope
- Why: the Fit-to-Standard workshop found most claimed gaps were unfamiliarity
  rather than genuine requirements. Standard is the default; deviation needs a
  written reason and an owner.

### D-002 · No custom code in Finance for phase 1
- 2026-06-30 · decided · scope
- Why: custom code in Finance is the single largest driver of upgrade cost. The
  boundary keeps the Realize phase from expanding. Exceptions require a steering
  committee decision.

### D-003 · Cutover planning deferred until the go-live date is confirmed
- 2026-08-12 · decided · timeline
- Why: a rehearsal schedule built against an unconfirmed date would be rebuilt.
  Tracked as T-014, parked on dependency rather than cancelled.`
};

const BOOTSTRAP_DOCS = {
'README.md': `# Your project

> Replace this file. Story S-001 is where you write what this project actually is.

Right now this project has almost no documents — that is expected, and the Docs
view will show you exactly which ones are missing.

## How this works

Setting a project up **is** a project. So it arrives as a backlog rather than a
wizard: ten stories on the board, each producing one real file.

1. Work them roughly in order — dependencies are set, so the board shows what is
   ready.
2. Stories marked **Human** are yours. Stories marked **AI** are handoffs.
3. When the Setup epic is done, this README will describe your project, and the
   Docs view will show a full set of documents.

## Working with the AI

Open this folder in Claude Code (or the Claude app with folder access) and say:

> Read AGENTS.md, then read tasks/INDEX.md and tell me which story is ready.

That is the whole loop. The board shows you what happened.`,

'AGENTS.md': `# AGENTS.md — starting rules

> This is a starting point. Story S-007 replaces it with rules for **your**
> project. Keep the shape; change the content.

## Finding work

1. Read tasks/INDEX.md first — one row per story. Do not read every file.
2. Pick a story with state todo, no hold, and all depends_on **done**.
3. Read that one story file and work only that.

## Working

- Set state doing and actor AI when you start.
- Append to the Test Log. Never edit or delete an existing entry.
- If you change the Goal, Scope or Acceptance Criteria, **bump rev** — that marks
  earlier test evidence stale, which is correct.
- Finish at state review, actor Human. Stop there.

## Rules that matter most for a new project

| Rule | Why |
|---|---|
| Ask rather than guess | A document full of plausible invention is worse than a short true one. |
| The human accepts work | Review means claimed done, not done. |
| Never write INDEX.md | It is generated. Regenerate it. |
| Record real decisions | If it moves timeline, scope, risk or commercials, it goes in DECISIONS.md. |`
,

'CLAUDE.md': `# CLAUDE.md — working context

> Story S-008 replaces this with rules for **your** project. Keep the shape.

## What this is

Nothing yet. Story S-001 is where you say what this project is.

## House rules

### Ask rather than guess
A document full of plausible invention is worse than a short true one. Up to five
questions beats one confident wrong paragraph.

### The human accepts work
Finish at review, never at done. Review means claimed done; a person decides.

### Write reasons, not just rules
A rule without a reason gets "improved" away by whoever reads it next.

### Small stories
If something needs more than about a day, split it.

## Current state

Project setup. Ten stories in tasks/. Work them in dependency order — the board
and tasks/INDEX.md both show what is ready.`
};

/* ------------------------------------------------------------------- seeds */

const SEEDS = {
  vibe: {
    label: 'Vibe coding: a tutorial',
    hint: 'Sixteen stories that teach building with an AI — the loop, and the habits.',
    project: 'Your first build with AI',
    tickets: () => VIBE_SEED,
    docs: () => ({ ...VIBE_DOCS })
  },
  sap: {
    label: 'SAP S/4HANA Programme',
    hint: 'Fit-to-Standard, master data, SIT/UAT and cutover on a SAFe spine.',
    project: 'Demo — S/4HANA Finance',
    tickets: () => SAP_SEED,
    docs: () => ({ ...SAP_DOCS })
  },
  start: {
    label: 'Start a new project',
    hint: 'Ten stories that walk you and the AI through setting a project up properly.',
    project: 'New Project — Setup',
    tickets: () => BOOTSTRAP_SEED,
    docs: () => ({ ...BOOTSTRAP_DOCS })
  }
};

/* ------------------------------------------------------------------- parsing */

const LIST_FIELDS = new Set(['depends_on', 'tools', 'decisions']);
const NUM_FIELDS  = new Set(['rev', 'wsjf_bv', 'wsjf_tc', 'wsjf_rr', 'wsjf_size']);
const KNOWN_FIELDS = new Set([
  'id', 'title', 'stage', 'state', 'actor', 'priority', 'epic', 'feature',
  'work_type', 'increment', 'rev', 'parent', 'hold', 'defer_reason',
  'revisit_trigger', ...LIST_FIELDS, ...NUM_FIELDS
]);

const scalar = (raw) => String(raw).trim().replace(/^["']|["']$/g, '');

function parseList(raw) {
  const inner = String(raw).trim().replace(/^\[|\]$/g, '');
  return inner.trim() ? inner.split(',').map(scalar).filter(Boolean) : [];
}

/** `r3 · 2026-08-30 · pass · manual · Human · note` */
function parseTestEntry(line) {
  const p = line.split('·').map((s) => s.trim());
  if (p.length < 3) return null;
  return {
    rev: parseInt(String(p[0]).replace(/^r/i, ''), 10) || 1,
    date: p[1] || '',
    verdict: /^pass$/i.test(p[2]) ? 'pass' : 'fail',
    method: p[3] || '',
    actor: p[4] || '',
    note: p.slice(5).join(' · ')
  };
}

/** Parse one story's Markdown into a ticket object. */
function parseTicket(md) {
  const text = String(md).replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;

  const t = { scope: [], acceptance: [], testLog: [], goal: '', notes: '', _extra: {} };

  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const raw = line.slice(i + 1).trim();
    if (LIST_FIELDS.has(key))      t[key] = parseList(raw);
    else if (NUM_FIELDS.has(key))  t[key] = Number(scalar(raw)) || 0;
    else if (KNOWN_FIELDS.has(key)) t[key] = scalar(raw);
    else t._extra[key] = raw;            // round-trip anything we don't model
  }

  const sections = {};
  let current = null;
  for (const line of m[2].split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { current = h[1].toLowerCase(); sections[current] = []; continue; }
    if (current) sections[current].push(line);
  }
  const listOf = (name) => (sections[name] || [])
    .map((l) => l.match(/^\s*(?:\d+\.|[-*])\s+(.*)$/)).filter(Boolean).map((mm) => mm[1].trim());

  t.goal = (sections['goal'] || []).join('\n').trim();
  t.notes = (sections['notes'] || []).join('\n').trim();
  t.scope = listOf('scope');
  t.acceptance = listOf('acceptance criteria');
  t.testLog = listOf('test log').map(parseTestEntry).filter(Boolean);

  t.rev = Math.max(1, t.rev || 1);
  t.state = STATES.some((s) => s.id === t.state) ? t.state : 'todo';
  t.stage = STAGES.some((s) => s.id === t.stage) ? t.stage : 'build';
  t.actor = ACTORS.some((a) => a.id === t.actor) ? t.actor : 'AI';
  t.priority = /^P[012]$/.test(t.priority || '') ? t.priority : 'P2';
  t.feature = t.feature || 'Unassigned';
  t.epic = t.epic || '';
  t.increment = t.increment || '';
  for (const f of LIST_FIELDS) if (!Array.isArray(t[f])) t[f] = [];

  return t.id ? t : null;
}

/* --------------------------------------------------------------- serialising
   Round-trips back to the same shape parseTicket() reads. Unknown frontmatter
   keys are preserved via _extra so saves stay lossless. */

function serialise(t) {
  const L = ['---'];
  const put = (k, v) => { if (v !== undefined && v !== null && v !== '' && v !== 0) L.push(`${k}: ${v}`); };

  put('id', t.id);
  put('title', t.title);
  put('stage', t.stage);
  put('state', t.state);
  put('actor', t.actor);
  put('priority', t.priority);
  put('epic', t.epic);
  put('feature', t.feature);
  put('work_type', t.work_type);
  put('increment', t.increment);
  put('rev', t.rev);
  put('parent', t.parent);
  for (const f of ['depends_on', 'tools', 'decisions']) {
    if (t[f] && t[f].length) L.push(`${f}: [${t[f].join(', ')}]`);
  }
  for (const f of ['wsjf_bv', 'wsjf_tc', 'wsjf_rr', 'wsjf_size']) put(f, t[f]);
  put('hold', t.hold);
  put('defer_reason', t.defer_reason);
  put('revisit_trigger', t.revisit_trigger);
  for (const [k, v] of Object.entries(t._extra || {})) L.push(`${k}: ${v}`);

  L.push('---', '');
  if (t.goal) L.push('## Goal', t.goal, '');
  if (t.scope.length) { L.push('## Scope'); t.scope.forEach((s, i) => L.push(`${i + 1}. ${s}`)); L.push(''); }
  if (t.acceptance.length) { L.push('## Acceptance Criteria'); t.acceptance.forEach((s, i) => L.push(`${i + 1}. ${s}`)); L.push(''); }
  if (t.testLog.length) {
    L.push('## Test Log');
    for (const e of t.testLog) {
      L.push(`- r${e.rev} · ${e.date} · ${e.verdict} · ${e.method} · ${e.actor}${e.note ? ' · ' + e.note : ''}`);
    }
    L.push('');
  }
  if (t.notes) L.push('## Notes', t.notes, '');
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* --------------------------------------------------------------------- state */

const state = {
  project: 'Demo — Customer Portal',
  source: 'demo',
  tickets: [],
  byId: new Map(),
  features: [],
  dirHandle: null,
  tickets_dirty: false,
  lane: 'stage',
  density: 'standard',
  sort: 'priority',
  theme: 'dark',
  q: '', fActor: '', fPriority: '', fTest: '', fFeature: '',
  onlyHandoff: false,
  showParked: false,
  selectedId: null,
  railOn: true,
  flash: '',
  view: 'board',
  seed: 'vibe',
  planLevel: 'feature',
  settings: null,
  settingsKey: 'vibe',
  bridgeId: null,
  docs: {},
  activeDoc: ''
};

const PREF_KEY = 'kanban4.prefs';
const PREF_KEYS = ['lane', 'density', 'sort', 'theme', 'railOn', 'view', 'planLevel'];

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    for (const k of PREF_KEYS) if (p[k] !== undefined) state[k] = p[k];
  } catch (_) { /* first run, or storage blocked */ }
}
function savePrefs() {
  try {
    const out = {};
    for (const k of PREF_KEYS) out[k] = state[k];
    localStorage.setItem(PREF_KEY, JSON.stringify(out));
  } catch (_) { /* storage blocked — prefs just won't persist */ }
}

/* -------------------------------------------------------------------- derive */

/** untested | verified | stale — stale is the one that matters. AGENTS.md §4 */
function testStatus(t) {
  const passes = t.testLog.filter((e) => e.verdict === 'pass');
  if (!passes.length) return { status: 'untested', at: null };
  const top = passes.reduce((a, b) => (b.rev >= a.rev ? b : a));
  return { status: top.rev >= t.rev ? 'verified' : 'stale', at: top.rev };
}

/** SAFe WSJF = Cost of Delay / Job Size, CoD = BV + TC + RR|OE. */
function wsjf(t) {
  const bv = t.wsjf_bv || 0, tc = t.wsjf_tc || 0, rr = t.wsjf_rr || 0, sz = t.wsjf_size || 0;
  if (!sz || !(bv || tc || rr)) return null;
  return Math.round(((bv + tc + rr) / sz) * 10) / 10;
}

/** Signature of the fields whose change should force a revision bump. */
const revSig = (t) => JSON.stringify([t.goal, t.scope, t.acceptance]);

function derive() {
  state.byId = new Map(state.tickets.map((t) => [t.id, t]));

  for (const t of state.tickets) {
    const ts = testStatus(t);
    t._test = ts.status;
    t._testedAt = ts.at;
    t._wsjf = wsjf(t);
    t._parked = t.hold === 'deferred';
    t._blocked = t.hold === 'blocked';
    t._children = [];
    if (t._sig === undefined) t._sig = revSig(t);
  }

  for (const t of state.tickets) {
    if (t.parent && state.byId.has(t.parent)) state.byId.get(t.parent)._children.push(t.id);
  }

  for (const t of state.tickets) {
    t._unmet = t.depends_on.filter((id) => {
      const d = state.byId.get(id);
      return d && d.state !== 'done';
    });
    t._kind = t.parent ? 'Task' : 'Story';     // SAFe / ADO naming
    t._needsBump = revSig(t) !== t._sig;

    // AGENTS.md §6 — a handoff is a ticket whose actor changes. Derived:
    // review always means "claimed done, human hasn't agreed"; an unblocked
    // todo owned by AI is ready to dispatch.
    if (t.state === 'review') t._handoff = 'to-human';
    else if (t.state === 'todo' && t.actor === 'AI' && !t._unmet.length && !t.hold) t._handoff = 'to-ai';
    // `Both` always needs a person, so it is never auto-dispatchable.
    else t._handoff = null;
  }

  // Epic → Feature grouping, both derived from labels
  const fmap = new Map();
  for (const t of state.tickets) {
    const key = t.feature;
    if (!fmap.has(key)) fmap.set(key, { name: key, epic: t.epic || '', total: 0, done: 0 });
    const f = fmap.get(key);
    f.total++;
    if (t.state === 'done') f.done++;
    if (!f.epic && t.epic) f.epic = t.epic;
  }
  state.features = [...fmap.values()]
    .map((f) => ({ ...f, pct: f.total ? Math.round((f.done / f.total) * 100) : 0 }))
    .sort((a, b) => (a.epic || '~').localeCompare(b.epic || '~') || a.name.localeCompare(b.name));

  state.tickets_dirty = state.tickets.some((t) => t._dirty);
}

const PRI_ORDER = { P0: 0, P1: 1, P2: 2 };

function sortRows(rows) {
  const by = state.sort;
  return rows.slice().sort((a, b) => {
    if (by === 'wsjf') {
      const av = a._wsjf === null ? -1 : a._wsjf;
      const bv = b._wsjf === null ? -1 : b._wsjf;
      if (av !== bv) return bv - av;                       // highest WSJF first
    }
    if (by === 'wsjf' || by === 'priority') {
      const p = PRI_ORDER[a.priority] - PRI_ORDER[b.priority];
      if (p) return p;
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

function visible() {
  const q = state.q.trim().toLowerCase();
  const rows = state.tickets.filter((t) => {
    if (t._parked && !state.showParked) return false;
    if (state.fActor && t.actor !== state.fActor) return false;
    if (state.fPriority && t.priority !== state.fPriority) return false;
    if (state.fTest && t._test !== state.fTest) return false;
    if (state.fFeature && t.feature !== state.fFeature) return false;
    if (state.onlyHandoff && !t._handoff) return false;
    if (q) {
      const hay = [t.id, t.title, t.goal, t.epic, t.feature, t.work_type, t.increment,
        (t.tools || []).join(' ')].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return sortRows(rows);
}

/* --------------------------------------------------------------------- utils */

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const el = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, '0');

let flashTimer = null;
function flash(msg) {
  state.flash = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { state.flash = ''; render(); }, 2600);
}

function markDirty(t) { t._dirty = true; }

/* ------------------------------------------------------------------ settings
   Project identity and label vocabulary.

   Renaming a label changes ONLY what is displayed. The files keep their values
   (`state: todo` stays `state: todo`), so a backlog renamed for an SAP audience
   is still readable by any other board or agent. Display is a view concern;
   the data is the contract.

   Stored per project in localStorage. "Copy as AGENTS.md block" emits the same
   settings as YAML so they can travel with the folder instead — which is where
   they belong once the board can write the contract file (ROADMAP.md). */

/* Dropped into assets/ by hand. The header falls back to the accent dot if it is
   missing, so the board works before the file exists. */
const DEFAULT_LOGO = 'assets/icon.png';

const DEFAULT_LABELS = {
  app: 'Relay',
  state:     { todo: 'To Do', doing: 'In Progress', review: 'Review', done: 'Done' },
  stage:     { plan: 'Plan', build: 'Build' },
  actor:     { AI: 'AI', Human: 'Human', Both: 'Both' },
  level:     { epic: 'Epic', feature: 'Feature', story: 'Story', task: 'Task' },
  increment: 'Increment'
};

const LABEL_GROUPS = [
  { kind: 'state', title: 'States', note: 'The four board columns.' },
  { kind: 'stage', title: 'Stages', note: 'The plan/build axis. SAP Activate phases go here.' },
  { kind: 'actor', title: 'Actors', note: 'Who holds the work.' },
  { kind: 'level', title: 'Levels', note: 'The hierarchy, top to bottom.' }
];

function blankSettings() {
  return {
    app: '', title: '', subtitle: '', logo: '', hideAbout: false,
    labels: { state: {}, stage: {}, actor: {}, level: {}, increment: '' }
  };
}

/** Display label for a value. Falls back to the default, then to the raw id. */
function lbl(kind, id) {
  const custom = (state.settings.labels[kind] || {})[id];
  if (custom && custom.trim()) return custom.trim();
  const dflt = DEFAULT_LABELS[kind];
  return (dflt && dflt[id]) || String(id);
}

function lblIncrement() {
  return (state.settings.labels.increment || '').trim() || DEFAULT_LABELS.increment;
}

function appName() { return (state.settings.app || '').trim() || DEFAULT_LABELS.app; }
function projectTitle() { return (state.settings.title || '').trim() || state.project; }

const settingsKey = () => 'kanban4.settings:' + (state.settingsKey || 'default');

function loadSettings() {
  state.settings = blankSettings();
  try {
    const raw = localStorage.getItem(settingsKey());
    if (!raw) return;
    const s = JSON.parse(raw);
    state.settings = Object.assign(blankSettings(), s);
    state.settings.labels = Object.assign(blankSettings().labels, s.labels || {});
  } catch (_) { /* corrupt or blocked — fall back to defaults */ }
}

function persistSettings() {
  try { localStorage.setItem(settingsKey(), JSON.stringify(state.settings)); }
  catch (_) { /* storage blocked — settings just won't persist */ }
}

/* ---- the panel ---- */

function settingsHTML() {
  const s = state.settings;
  const row = (kind, id) => `
    <div class="set-pair">
      <code>${esc(id)}</code>
      <input class="fi" data-setting="labels.${kind}.${esc(id)}"
             value="${esc((s.labels[kind] || {})[id] || '')}"
             placeholder="${esc(DEFAULT_LABELS[kind][id])}">
    </div>`;

  return `
    <div class="set-sect">
      <h3>Project</h3>
      <p class="set-note">Shown in the header. The logo is stored in this browser, resized to 64px.</p>
      <div class="set-grid">
        <label>Board name</label>
        <input class="fi" data-setting="app" value="${esc(s.app)}" placeholder="${esc(DEFAULT_LABELS.app)}">
        <label>Project title</label>
        <input class="fi" data-setting="title" value="${esc(s.title)}" placeholder="${esc(state.project)}">
        <label>Subtitle</label>
        <input class="fi" data-setting="subtitle" value="${esc(s.subtitle)}"
               placeholder="e.g. Phase 1 &middot; Wave 1">
        <label>About page</label>
        <label class="chk" style="color:var(--text)">
          <input type="checkbox" data-setting-bool="hideAbout"
                 ${state.settings.hideAbout ? '' : 'checked'}> Show the About page in Docs
        </label>
        <label>Logo</label>
        <div class="logo-row">
          <img class="logo-prev" src="${esc(s.logo || DEFAULT_LOGO)}" alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="logo-empty" style="display:none">none</div>
          <button class="btn" data-action="logo-pick">Choose image</button>
          ${s.logo ? '<button class="btn" data-action="logo-clear">Use default</button>' : ''}
          <input type="file" id="logoInput" accept="image/*" hidden>
        </div>
      </div>
    </div>

    <div class="set-sect">
      <h3>Labels</h3>
      <p class="set-note">
        Renames what you see, nothing else. The files keep their values, so a backlog
        relabelled for one audience stays readable by every other board and agent.
        Leave blank for the default.
      </p>
      ${LABEL_GROUPS.map((g) => `
        <div style="margin-bottom:12px">
          <div class="set-note" style="margin-bottom:5px"><b>${esc(g.title)}</b> — ${esc(g.note)}</div>
          <div class="set-pairs">${Object.keys(DEFAULT_LABELS[g.kind]).map((id) => row(g.kind, id)).join('')}</div>
        </div>`).join('')}
      <div class="set-pairs">
        <div class="set-pair">
          <code>increment</code>
          <input class="fi" data-setting="labels.increment" value="${esc(s.labels.increment || '')}"
                 placeholder="${esc(DEFAULT_LABELS.increment)}">
        </div>
      </div>
    </div>`;
}

function setSetting(path, value) {
  const parts = path.split('.');
  let node = state.settings;
  while (parts.length > 1) {
    const k = parts.shift();
    if (!node[k] || typeof node[k] !== 'object') node[k] = {};
    node = node[k];
  }
  node[parts[0]] = value;
  persistSettings();
}

/** Emit the same settings as a YAML block for AGENTS.md. */
function settingsAsYaml() {
  const s = state.settings;
  const L = [];
  L.push('# Board settings — display only. Story files keep their own values.');
  L.push('board:');
  if (appName() !== DEFAULT_LABELS.app) L.push(`  name: ${appName()}`);
  L.push(`  project: ${projectTitle()}`);
  if (s.subtitle) L.push(`  subtitle: ${s.subtitle}`);
  L.push('  labels:');
  for (const g of LABEL_GROUPS) {
    const entries = Object.keys(DEFAULT_LABELS[g.kind])
      .map((id) => [id, lbl(g.kind, id)])
      .filter(([id, v]) => v !== DEFAULT_LABELS[g.kind][id]);
    if (!entries.length) continue;
    L.push(`    ${g.kind}:`);
    for (const [id, v] of entries) L.push(`      ${id}: ${v}`);
  }
  if (lblIncrement() !== DEFAULT_LABELS.increment) L.push(`    increment: ${lblIncrement()}`);
  return L.join('\n') + '\n';
}

/** Read an image file, downscale to 64px, store as a data URI. */
function pickLogo(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const N = 64;
      const c = document.createElement('canvas');
      c.width = N; c.height = N;
      const ctx = c.getContext('2d');
      const scale = Math.max(N / img.width, N / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
      try {
        setSetting('logo', c.toDataURL('image/png'));
        renderSettings();
        render();
        flash('Logo updated');
      } catch (_) { alert('Could not read that image.'); }
    };
    img.onerror = () => alert('Could not read that image.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function renderSettings() {
  const body = el('settingsBody');
  if (body) body.innerHTML = settingsHTML();
}

function openSettings() {
  renderSettings();
  el('settingsBack').hidden = false;
}
function closeSettings() { el('settingsBack').hidden = true; }

/* ------------------------------------------------------------------ renderers */

function cardHTML(t) {
  const flag = t._blocked ? 'is-blocked' : (t._parked ? 'is-deferred' : '');
  const sel = t.id === state.selectedId ? 'sel' : '';

  const chips = [
    `<span class="chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span>`,
    t._wsjf !== null ? `<span class="chip wsjf">WSJF ${t._wsjf}</span>` : '',
    `<span class="chip opt">${esc(t.feature)}</span>`,
    t.work_type ? `<span class="chip opt ${t.work_type === 'enabler' ? 'enabler' : ''}">${esc(t.work_type)}</span>` : '',
    t.rev > 1 ? `<span class="chip rev">r${t.rev}</span>` : '',
    t._children.length ? `<span class="chip opt">${t._children.length} task${t._children.length > 1 ? 's' : ''}</span>` : '',
    t.parent ? `<span class="chip opt">↳ ${esc(t.parent)}</span>` : ''
  ].join('');

  // Full density shows more FIELDS, not just more lines of the same text.
  const more = [
    t.increment ? ['PI', esc(t.increment)] : null,
    t.epic ? ['Epic', esc(t.epic)] : null,
    t.acceptance.length ? ['Criteria', `${t.acceptance.length} defined`] : null,
    t.depends_on.length ? ['Depends', esc(t.depends_on.join(', '))] : null,
    t.tools.length ? ['Tools', esc(t.tools.join(', '))] : null,
    t.revisit_trigger ? ['Revisit', esc(t.revisit_trigger)] : null
  ].filter(Boolean).map(([k, v]) =>
    `<div class="cm-row"><span class="cm-k">${k}</span><span class="cm-v">${v}</span></div>`).join('');

  const testLabel = { verified: '✓ verified', stale: `⚠ stale · r${t._testedAt}`, untested: '· untested' };
  const foot = [
    `<span class="test ${t._test}">${esc(testLabel[t._test])}</span>`,
    t._blocked ? `<span class="flagtag blocked">blocked</span>` : '',
    t._parked ? `<span class="flagtag">parked · ${esc(t.defer_reason || '')}</span>` : '',
    t._unmet.length ? `<span class="flagtag blocked">waits on ${esc(t._unmet.join(', '))}</span>` : '',
    t._dirty ? `<span class="flagtag" style="color:var(--accent)">edited</span>` : '',
    t._handoff === 'to-human' ? `<span class="handoff">⇄ needs you</span>` : '',
    t._handoff === 'to-ai' ? `<span class="handoff">⇄ ready</span>` : ''
  ].join('');

  return `
  <article class="card ${t.state} ${flag} ${sel}" data-card="${esc(t.id)}" draggable="true">
    <div class="card-top micro">
      <span class="card-actor ${t.actor.toLowerCase()}"><i class="actor-dot"></i> ${esc(lbl('actor', t.actor))}</span>
      <span class="sep">/</span><span>${esc(lbl('level', t._kind.toLowerCase()))}</span>
      <span class="card-id">${esc(t.id)}</span>
    </div>
    <h3 class="card-title">${esc(t.title)}</h3>
    ${t.goal ? `<div class="card-goal excerpt">${esc(t.goal)}</div>` : ''}
    <div class="chips">${chips}</div>
    ${more ? `<div class="card-more">${more}</div>` : ''}
    <div class="card-foot micro">${foot}</div>
  </article>`;
}

function columnsHTML(rows, laneAxis, laneId) {
  return `<div class="cols">${STATES.map((col) => {
    const cards = rows.filter((t) => t.state === col.id);
    // A drop target is a (state, lane) pair — dropping across lanes moves both.
    const drop = `${col.id}|${laneAxis || 'none'}|${laneId || ''}`;
    return `
      <section class="col">
        <div class="col-head micro">
          <i class="col-dot" style="background:var(--s-${col.id})"></i>
          <span class="col-name">${esc(lbl('state', col.id))}</span>
          <span class="col-n">${pad2(cards.length)}</span>
        </div>
        <div class="col-sub">${esc(col.sub)}</div>
        <div class="col-body" data-drop="${esc(drop)}">
          ${cards.length
            ? cards.map(cardHTML).join('')
            : '<div class="col-empty drop-hint micro">drop here</div>'}
        </div>
      </section>`;
  }).join('')}</div>`;
}

function laneGroups(rows) {
  if (state.lane === 'stage') return STAGES.map((s) => ({ ...s, label: lbl('stage', s.id), pick: (t) => t.stage === s.id }));
  if (state.lane === 'actor') return ACTORS.map((a) => ({ ...a, label: lbl('actor', a.id), pick: (t) => t.actor === a.id }));
  if (state.lane === 'increment') {
    const pis = [...new Set(rows.map((t) => t.increment || 'Unscheduled'))].sort();
    return pis.map((p) => ({ id: p, label: p, sub: '', pick: (t) => (t.increment || 'Unscheduled') === p }));
  }
  return null;
}

function boardHTML() {
  const rows = visible();
  if (!rows.length) return `<div class="empty-board">Nothing matches these filters.</div>`;

  const lanes = laneGroups(rows);
  if (!lanes) return columnsHTML(rows, 'none', '');

  return lanes.map((lane) => {
    const inLane = rows.filter(lane.pick);
    if (!inLane.length) return '';
    return `
      <div class="lane-head micro">
        <span>${esc(lane.label)}</span>
        <span class="lane-count">${pad2(inLane.length)}</span>
        ${lane.sub ? `<span class="lane-count">· ${esc(lane.sub)}</span>` : ''}
        <span class="rule"></span>
      </div>
      ${columnsHTML(inLane, state.lane, lane.id)}`;
  }).join('');
}

function railHTML() {
  let out = `<div class="rail-head micro">${esc(lbl('level','epic'))} → ${esc(lbl('level','feature'))} · derived</div>
    <button class="epic" data-action="feature" data-v="" aria-pressed="${!state.fFeature}">
      <div class="epic-top"><span class="epic-name">All work</span>
      <span class="epic-pct">${state.tickets.length}</span></div>
    </button>`;

  let lastEpic = null;
  for (const f of state.features) {
    const epicName = f.epic || 'Unassigned';
    if (epicName !== lastEpic) {
      out += `<div class="rail-epic">${esc(epicName)}</div>`;
      lastEpic = epicName;
    }
    out += `
      <button class="epic" data-action="feature" data-v="${esc(f.name)}" aria-pressed="${state.fFeature === f.name}">
        <div class="epic-top">
          <span class="epic-name">${esc(f.name)}</span>
          <span class="epic-pct">${f.done}/${f.total}</span>
        </div>
        <div class="bar"><span style="width:${f.pct}%"></span></div>
      </button>`;
  }
  return out;
}

function statsHTML() {
  const t = state.tickets;
  const n = (f) => pad2(t.filter(f).length);
  const stale = t.filter((x) => x._test === 'stale').length;
  const hand = t.filter((x) => x._handoff === 'to-human').length;
  return `
    <span class="stat"><b>${pad2(t.length)}</b> total</span>
    <span class="stat"><i class="dot" style="background:var(--s-doing)"></i><b>${n((x) => x.state === 'doing')}</b> wip</span>
    <span class="stat"><i class="dot" style="background:var(--s-review)"></i><b>${n((x) => x.state === 'review')}</b> review</span>
    ${hand ? `<span class="stat is-hand"><b>${pad2(hand)}</b> handoff</span>` : ''}
    ${stale ? `<span class="stat is-alert"><b>${pad2(stale)}</b> stale</span>` : ''}`;
}

/* ------------------------------------------------------------ editor / detail */

const opt = (v, cur, label) =>
  `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label || v || '—')}</option>`;

function detailHTML() {
  const t = state.byId.get(state.selectedId);
  if (!t) {
    return `<div class="detail-empty">Select a card to read and edit it — goal, scope,
      acceptance criteria, WSJF and the full test history.</div>`;
  }

  const banners = [
    t._needsBump
      ? `<div class="banner rev">
           <span><b>Scope changed.</b> <span class="bn-note">Bump to r${t.rev + 1} so existing
           test evidence is correctly marked stale.</span></span>
           <button class="btn" data-action="bump">Bump → r${t.rev + 1}</button>
         </div>` : '',
    t._test === 'stale'
      ? `<div class="banner stale"><b>Stale test.</b> Last pass was at r${t._testedAt};
         this story is now at r${t.rev}. Treat it as untested.</div>` : '',
    t._handoff === 'to-human'
      ? `<div class="banner hand"><b>Handoff — needs you.</b> Claimed done, awaiting review.</div>` : '',
    t._parked
      ? `<div class="banner"><b>Parked · ${esc(t.defer_reason || '')}</b><br>
         ${esc(DEFER_REASONS[t.defer_reason] || '')}${
           t.revisit_trigger ? `<br>Revisit: ${esc(t.revisit_trigger)}` : ''}</div>` : ''
  ].join('');

  const w = ['wsjf_bv', 'wsjf_tc', 'wsjf_rr', 'wsjf_size'].map((f) =>
    `<select class="fi wsjf-n" data-field="${f}">
       ${opt('', String(t[f] || ''), '–')}${FIB.map((n) => opt(String(n), String(t[f] || ''))).join('')}
     </select>`).join('');

  const testRows = t.testLog.length
    ? t.testLog.map((e) => `
        <div class="tl-row ${e.verdict} ${e.rev < t.rev ? 'superseded' : ''}">
          <span class="r">r${e.rev}</span><span class="v">${esc(e.verdict)}</span>
          <span class="n">${esc(e.date)} · ${esc(e.method)} · ${esc(e.actor)}${e.note ? ' · ' + esc(e.note) : ''}</span>
        </div>`).join('')
    : `<div style="color:var(--faint);font-size:11.5px">No tests recorded.</div>`;

  return `
  <div class="detail-inner">
    <div class="detail-head micro">
      <span class="card-actor ${t.actor.toLowerCase()}"><i class="actor-dot"></i> ${esc(lbl('actor', t.actor))}</span>
      <span style="color:var(--faint)">${esc(lbl('level', t._kind.toLowerCase()))} ${esc(t.id)} · r${t.rev}</span>
      <button class="btn ask" data-action="bridge" title="Get an AI to work this story">Ask an AI</button>
      <button class="btn icon" data-action="close" title="Close">✕</button>
    </div>

    <input class="fi title" data-field="title" value="${esc(t.title)}" placeholder="Story title">
    <div style="height:12px"></div>
    ${banners}

    <div class="fgrid">
      <label>Stage</label>
      <select class="fi" data-field="stage">${STAGES.map((s) => opt(s.id, t.stage, lbl('stage', s.id))).join('')}</select>
      <label>State</label>
      <select class="fi" data-field="state">${STATES.map((s) => opt(s.id, t.state, lbl('state', s.id))).join('')}</select>
      <label>Actor</label>
      <select class="fi" data-field="actor">${ACTORS.map((a) => opt(a.id, t.actor, lbl('actor', a.id))).join('')}</select>
      <label>Priority</label>
      <select class="fi" data-field="priority">${['P0', 'P1', 'P2'].map((p) => opt(p, t.priority)).join('')}</select>
      <label>Type</label>
      <select class="fi" data-field="work_type">${WORK_TYPES.map((k) => opt(k, t.work_type)).join('')}</select>
      <label>Epic</label>
      <input class="fi" data-field="epic" value="${esc(t.epic)}" placeholder="Portfolio epic">
      <label>Feature</label>
      <input class="fi" data-field="feature" value="${esc(t.feature)}" placeholder="Feature">
      <label>Increment</label>
      <input class="fi" data-field="increment" value="${esc(t.increment)}" placeholder="PI-2">
      <label>Hold</label>
      <select class="fi" data-field="hold">
        ${opt('', t.hold || '', 'none')}${opt('blocked', t.hold || '')}${opt('deferred', t.hold || '')}
      </select>
      ${t.hold === 'deferred' ? `
      <label>Reason</label>
      <select class="fi" data-field="defer_reason">
        ${Object.keys(DEFER_REASONS).map((k) => opt(k, t.defer_reason || '')).join('')}
      </select>
      <label>Revisit</label>
      <input class="fi" data-field="revisit_trigger" value="${esc(t.revisit_trigger || '')}"
             placeholder="date, milestone or condition">` : ''}
      <label>Depends on</label>
      <input class="fi" data-field="depends_on" value="${esc(t.depends_on.join(', '))}" placeholder="T-002, T-003">
      <label>Tools</label>
      <input class="fi" data-field="tools" value="${esc(t.tools.join(', '))}" placeholder="claude-code, browser">
    </div>

    <div class="sect">
      <h3>WSJF <span class="h3-note">Cost of Delay ÷ Job Size</span></h3>
      <div class="wsjf-lab"><span>BV</span><span>TC</span><span>RR|OE</span><span>Size</span><span></span></div>
      <div class="wsjf-row">${w}
        <span class="wsjf-out">${t._wsjf === null ? '—' : t._wsjf}</span>
      </div>
    </div>

    <div class="sect">
      <h3>Goal</h3>
      <textarea class="fi" data-field="goal" rows="2" placeholder="One line, user-visible outcome">${esc(t.goal)}</textarea>
    </div>
    <div class="sect">
      <h3>Scope <span class="h3-note">one per line</span></h3>
      <textarea class="fi" data-field="scope" rows="3">${esc(t.scope.join('\n'))}</textarea>
    </div>
    <div class="sect">
      <h3>Acceptance criteria <span class="h3-note">one per line</span></h3>
      <textarea class="fi" data-field="acceptance" rows="3">${esc(t.acceptance.join('\n'))}</textarea>
    </div>

    <div class="sect">
      <h3>Test log <span class="h3-note">append only</span></h3>
      <div class="testlog">${testRows}</div>
      <div class="tl-add">
        <select class="fi" id="tlVerdict"><option value="pass">pass</option><option value="fail">fail</option></select>
        <input class="fi" id="tlNote" placeholder="method · note (e.g. manual · all criteria met)">
        <button class="btn" data-action="addtest">Record @ r${t.rev}</button>
      </div>
    </div>

    <div class="sect">
      <h3>Notes</h3>
      <textarea class="fi" data-field="notes" rows="3">${esc(t.notes)}</textarea>
    </div>

    <div class="sect">
      <button class="btn" data-action="delete" style="color:var(--bad)">Delete ${esc(t.id)}</button>
    </div>
  </div>`;
}

/* ------------------------------------------------------------ markdown → html
   Deliberately small: headings, lists, tables, code, quotes, links, emphasis.
   No dependency, and it only ever renders files the user already has on disk. */

function mdInline(s) {
  let x = esc(s);
  x = x.replace(/`([^`]+)`/g, '<code>$1</code>');
  x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  x = x.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  x = x.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, txt, href) =>
    /^https?:/i.test(href)
      ? `<a href="${href}" target="_blank" rel="noopener">${txt || href}</a>`
      : `<a href="#" data-doclink="${href.replace(/^\.\//, '').split('#')[0]}">${txt || href}</a>`);
  return x;
}

function mdToHtml(src) {
  const fences = [];
  let s = String(src).replace(/\r\n/g, '\n');

  s = s.replace(/^---\n[\s\S]*?\n---\n/, '');                  // drop frontmatter
  s = s.replace(/```[a-z0-9+-]*\n([\s\S]*?)```/gi, (m, code) => {
    fences.push('<pre><code>' + esc(code.replace(/\n$/, '')) + '</code></pre>');
    return '@@FENCE' + (fences.length - 1) + '@@';
  });

  const out = [];
  let para = [], list = null, quote = [];

  const flushPara = () => { if (para.length) { out.push('<p>' + mdInline(para.join(' ')) + '</p>'); para = []; } };
  const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
  const flushQuote = () => {
    if (quote.length) { out.push('<blockquote>' + mdToHtml(quote.join('\n')) + '</blockquote>'); quote = []; }
  };
  const flushAll = () => { flushPara(); closeList(); flushQuote(); };

  const lines = s.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^>\s?/.test(line)) { flushPara(); closeList(); quote.push(line.replace(/^>\s?/, '')); continue; }
    flushQuote();

    if (!line.trim()) { flushPara(); closeList(); continue; }

    const fence = line.match(/^@@FENCE(\d+)@@$/);
    if (fence) { flushAll(); out.push(fences[Number(fence[1])]); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushAll(); const n = Math.min(h[1].length, 4); out.push(`<h${n}>${mdInline(h[2])}</h${n}>`); continue; }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }

    // table: a header row followed by a |---| separator
    if (/^\s*\|/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      flushAll();
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      let body = '';
      i += 2;
      for (; i < lines.length && /^\s*\|/.test(lines[i]); i++) {
        body += '<tr>' + cells(lines[i]).map((c) => `<td>${mdInline(c)}</td>`).join('') + '</tr>';
      }
      i--;
      out.push(`<table><thead><tr>${head.map((c) => `<th>${mdInline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`);
      continue;
    }

    const li = line.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.*)$/);
    if (li) {
      const want = li[1] ? 'ul' : 'ol';
      flushPara();
      if (list !== want) { closeList(); out.push('<' + want + '>'); list = want; }
      const box = li[3].match(/^\[([ xX])\]\s+(.*)$/);
      out.push(box
        ? `<li class="task">${box[1].trim() ? '&#9745;' : '&#9744;'} ${mdInline(box[2])}</li>`
        : `<li>${mdInline(li[3])}</li>`);
      continue;
    }

    closeList();
    para.push(line.trim());
  }
  flushAll();
  return out.join('\n');
}

/* ---------------------------------------------------------------- docs view */

function docHealth() {
  const req = DOC_SLOTS.filter((d) => d.required);
  const have = req.filter((d) => state.docs[d.file]);
  return { have: have.length, total: req.length, missing: req.filter((d) => !state.docs[d.file]) };
}

function docListHTML() {
  const h = docHealth();
  const pct = h.total ? Math.round((h.have / h.total) * 100) : 0;

  let out = '';
  if (!state.settings.hideAbout) {
    out += `
      <div class="doc-group">The tool</div>
      <button class="doc-item" data-action="doc" data-v="${ABOUT_KEY}"
              aria-pressed="${state.activeDoc === ABOUT_KEY}">
        <div class="doc-top">
          <span class="doc-name">About ${esc(appName())}</span>
        </div>
        <div class="doc-why">What this is and how to use it. Hide it in Settings.</div>
      </button>`;
  }

  out += `
    <div class="doc-health">
      <div class="hh"><span>Project documents</span><b>${h.have}/${h.total}</b></div>
      <div class="bar"><span style="width:${pct}%;background:${h.have === h.total ? 'var(--ok)' : 'var(--warn)'}"></span></div>
      <div class="hint">${h.missing.length
        ? `Missing: ${h.missing.map((d) => esc(d.file)).join(', ')}. These are the spine of a project someone — or an AI — can pick up without a briefing.`
        : 'All core documents present.'}</div>
    </div>`;

  let group = null;
  for (const slot of DOC_SLOTS) {
    if (slot.group !== group) { out += `<div class="doc-group">${esc(slot.group)}</div>`; group = slot.group; }
    const present = !!state.docs[slot.file];
    out += `
      <button class="doc-item ${present ? '' : 'missing'}"
              ${present ? `data-action="doc" data-v="${esc(slot.file)}"` : 'disabled'}
              aria-pressed="${state.activeDoc === slot.file}">
        <div class="doc-top">
          <span class="doc-name">${esc(slot.file)}</span>
          <span class="doc-badge ${present ? 'ok' : 'gap'}">${present ? 'present' : (slot.required ? 'missing' : 'optional')}</span>
        </div>
        <div class="doc-why">${esc(slot.why)}</div>
      </button>`;
  }

  const extras = Object.keys(state.docs).filter((f) => !DOC_SLOTS.some((d) => d.file === f)).sort();
  if (extras.length) {
    out += `<div class="doc-group">Also in this folder</div>`;
    for (const f of extras) {
      out += `
        <button class="doc-item" data-action="doc" data-v="${esc(f)}" aria-pressed="${state.activeDoc === f}">
          <div class="doc-top"><span class="doc-name">${esc(f)}</span></div>
        </button>`;
    }
  }
  return out;
}

function docMainHTML() {
  const name = state.activeDoc;
  if (name === ABOUT_KEY) {
    return `<div class="docmain-inner">
      <div class="doc-head"><h1>About ${esc(appName())}</h1></div>
      <div class="doc-meta">Ships with the board &middot; not a file in your project</div>
      <div class="md">${mdToHtml(ABOUT_DOC)}</div>
    </div>`;
  }
  const text = state.docs[name];
  if (!text) {
    const h = docHealth();
    return `<div class="doc-empty">
      Pick a document on the left.<br><br>
      ${h.missing.length
        ? `This project is missing <b>${h.missing.map((d) => esc(d.file)).join('</b>, <b>')}</b>.<br>
           A project carrying all of these can be handed to an AI — or a new team member — without a briefing.`
        : 'Every core document is present.'}
    </div>`;
  }
  const slot = DOC_SLOTS.find((d) => d.file === name);
  const words = text.trim().split(/\s+/).length;
  return `
    <div class="docmain-inner">
      <div class="doc-head"><h1>${esc(name)}</h1></div>
      <div class="doc-meta">${slot ? esc(slot.why) + ' &middot; ' : ''}${words} words</div>
      <div class="md">${mdToHtml(text)}</div>
    </div>`;
}

/* ------------------------------------------------------------------ plan view
   Rows × increments. Zoomed out it is a plan on a page; zoomed in it is a Gantt.
   Same grid either way — the Level control just changes what a row is.

   Deliberately no dates: a bar spans from the first increment containing any of
   a node's work to the last. Ordering, not measurement (ROADMAP.md).

   Colour: no categorical series. Our status tokens already occupy green/amber/
   blue/red/violet and the accent owns orange, so a series palette would
   impersonate state. Identity comes from the row label and the band it sits in;
   the bar encodes extent (position) and progress (fill) only. */

const PLAN_LEVELS = [
  { id: 'epic',    label: 'Epic' },
  { id: 'feature', label: 'Feature' },
  { id: 'story',   label: 'Story' }
];

const UNSCHEDULED = 'Unscheduled';

/** Increment order: numbers ascending, then anything wordless, then Unscheduled. */
function orderIncrements(list) {
  const num = (s) => {
    const m = String(s).match(/\d+/);
    return m ? parseInt(m[0], 10) : NaN;
  };
  return list.slice().sort((a, b) => {
    if (a === UNSCHEDULED) return 1;
    if (b === UNSCHEDULED) return -1;
    const na = num(a), nb = num(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb || a.localeCompare(b);
    if (!isNaN(na)) return -1;              // numbered before wordless ("Later")
    if (!isNaN(nb)) return 1;
    return a.localeCompare(b);
  });
}

/** Rows for the chosen level: {band, id, label, stories}, ordered as a plan reads.
    `idx` maps an increment label to its column position. */
function planRows(rows, level, idx) {
  const out = [];
  const push = (band, id, label, stories) => {
    if (stories.length) out.push({ band, id, label, stories });
  };

  if (level === 'epic') {
    for (const e of [...new Set(rows.map((t) => t.epic || 'Unassigned'))].sort()) {
      push('', e, e, rows.filter((t) => (t.epic || 'Unassigned') === e));
    }
  } else if (level === 'feature') {
    for (const f of state.features) {
      push(f.epic || 'Unassigned', f.name, f.name, rows.filter((t) => t.feature === f.name));
    }
  } else {
    for (const f of state.features) {
      for (const t of rows.filter((x) => x.feature === f.name)) {
        push(f.name, t.id, t.title, [t]);
      }
    }
  }

  // A plan reads top-left to bottom-right: order bands, and rows within a band,
  // by where their work starts. Alphabetical ordering would put "Making It Good"
  // above "The App", which is backwards for anyone reading it as a schedule.
  if (!idx) return out;
  const pos = (it) => it.stories.map((x) => idx.get(x.increment || UNSCHEDULED));
  const startOf = (it) => Math.min(...pos(it));
  const endOf = (it) => Math.max(...pos(it));

  // Ties on start break on end — shorter bars first. That is the cascade every
  // Gantt reader expects: "Shape It" above "Core Features", not alphabetically.
  const bandStart = new Map(), bandEnd = new Map();
  for (const it of out) {
    const s0 = startOf(it), e0 = endOf(it);
    if (!(bandStart.get(it.band) <= s0)) bandStart.set(it.band, s0);
    if (!(bandEnd.get(it.band) >= e0)) bandEnd.set(it.band, e0);
  }
  return out.sort((a, b) =>
    (bandStart.get(a.band) - bandStart.get(b.band)) ||
    (bandEnd.get(a.band) - bandEnd.get(b.band)) ||
    a.band.localeCompare(b.band) ||
    (startOf(a) - startOf(b)) ||
    (endOf(a) - endOf(b)) ||
    a.label.localeCompare(b.label));
}

function planHTML() {
  const rows = visible();
  if (!rows.length) return '<div class="empty-board">Nothing matches these filters.</div>';

  const cols = orderIncrements([...new Set(rows.map((t) => t.increment || UNSCHEDULED))]);
  const idx = new Map(cols.map((c, i) => [c, i]));
  const level = state.planLevel;
  const items = planRows(rows, level, idx);

  const cells = [];
  let r = 1;

  // header row
  cells.push(`<div class="pg-corner micro" style="grid-row:1;grid-column:1">
    ${esc(lbl('level', level))}</div>`);
  cols.forEach((c, i) => {
    const n = rows.filter((t) => (t.increment || UNSCHEDULED) === c).length;
    cells.push(`<div class="pg-colhead micro" style="grid-row:1;grid-column:${2 + i}">
      <span>${esc(c)}</span><b>${pad2(n)}</b></div>`);
  });
  cells.push(`<div class="pg-corner micro" style="grid-row:1;grid-column:-2">Done</div>`);
  r++;

  let band = null;
  for (const item of items) {
    if (item.band !== band) {
      band = item.band;
      if (band) {
        cells.push(`<div class="pg-band micro" style="grid-row:${r};grid-column:1/-1">${esc(band)}</div>`);
        r++;
      }
    }

    const positions = item.stories.map((t) => idx.get(t.increment || UNSCHEDULED));
    const from = Math.min(...positions);
    const to = Math.max(...positions);
    const done = item.stories.filter((t) => t.state === 'done').length;
    const total = item.stories.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const blocked = item.stories.some((t) => t._blocked);
    const parked = item.stories.every((t) => t._parked);
    const handoff = item.stories.some((t) => t._handoff === 'to-human');
    const stale = item.stories.some((t) => t._test === 'stale');

    const marks = [
      blocked ? '<i class="pg-mark blocked" title="contains blocked work"></i>' : '',
      handoff ? '<i class="pg-mark handoff" title="waiting on a human"></i>' : '',
      stale ? '<i class="pg-mark stale" title="contains stale test evidence"></i>' : ''
    ].join('');

    const tip = `${item.label} — ${done} of ${total} done` +
      `\n${cols[from]}${from === to ? '' : ' → ' + cols[to]}` +
      (blocked ? '\nContains blocked work' : '') +
      (handoff ? '\nWaiting on a human' : '') +
      (stale ? '\nContains stale test evidence' : '');

    const sel = (level === 'story' && item.id === state.selectedId) ||
                (level === 'feature' && item.id === state.fFeature) ? ' sel' : '';

    cells.push(`<div class="pg-label${sel}" style="grid-row:${r};grid-column:1"
      data-planrow="${esc(item.id)}" title="${esc(item.label)}">${esc(item.label)}</div>`);
    cells.push(`<div class="pg-bar${parked ? ' parked' : ''}${sel}"
      style="grid-row:${r};grid-column:${2 + from}/${3 + to}"
      data-planrow="${esc(item.id)}" title="${esc(tip)}">
        <i class="pg-fill" style="width:${pct}%"></i>
        <span class="pg-marks">${marks}</span>
      </div>`);
    cells.push(`<div class="pg-count micro" style="grid-row:${r};grid-column:-2">${done}/${total}</div>`);
    r++;
  }

  return `
    <div class="plan-inner">
      <div class="plan-head">
        <h2>${esc(state.project)}</h2>
        <div class="plan-sub">${items.length} ${esc(lbl('level', level))}${items.length === 1 ? '' : 's'}
          across ${cols.length} ${esc(lblIncrement().toLowerCase())}${cols.length === 1 ? '' : 's'} ·
          bars span where the work sits, not calendar dates</div>
      </div>
      <div class="pg" style="--n:${cols.length}">${cells.join('')}</div>
      <div class="plan-key micro">
        <span><i class="pg-fill-key"></i> completed</span>
        <span><i class="pg-mark blocked"></i> blocked</span>
        <span><i class="pg-mark handoff"></i> waiting on a human</span>
        <span><i class="pg-mark stale"></i> stale test</span>
        <span><i class="pg-parked-key"></i> parked</span>
      </div>
    </div>`;
}

/* ------------------------------------------------------------------- bridge
   "Ask an AI" — the route that needs no plan, no install and no folder access.

   The board composes the whole prompt for a story, the person carries it to
   whatever assistant they have, and pastes the reply back. The tool does the
   part that is actually hard: knowing what to ask, and checking what comes back.

   Three guarantees are enforced HERE rather than trusted to the assistant, so
   they hold whichever AI the person used:
     1. The id never changes.
     2. Test Log entries are only ever appended — nothing can be removed.
     3. Nothing arrives `done`. A person accepts work (AGENTS.md §6).            */

const FENCE = '`' + '`' + '`';

function dependencyContext(t) {
  if (!t.depends_on.length) return '';
  const lines = t.depends_on.map((id) => {
    const d = state.byId.get(id);
    return d ? `- ${d.id} "${d.title}" — ${d.state}` : `- ${id} (not found)`;
  });
  const unmet = t._unmet.length;
  return `\nThis story depends on:\n${lines.join('\n')}\n` +
    (unmet ? `\n${unmet} of those is not done yet. Say so and stop if the work cannot ` +
             `sensibly proceed without it.\n` : '');
}

function buildPrompt(t) {
  return `I am working on a project called "${projectTitle()}".

Work is tracked as one Markdown file per story. Please follow these rules:

- Do only what this story's Goal, Scope and Acceptance Criteria describe. If they are
  wrong or unclear, say so and stop rather than guessing.
- Append a line **inside the ## Test Log section** saying what you did and whether it
  passed — not at the end of the file, or it will be read as a note. Never edit or remove
  an existing line. The format is:
  - r<rev> · YYYY-MM-DD · pass|fail · how you checked · who · short note
- If you change the Goal, Scope or Acceptance Criteria, add 1 to \`rev\`. That correctly
  marks earlier test results as out of date.
- Finish with \`state: review\` and \`actor: Human\`. Never set \`state: done\` — a person
  accepts the work, not you.

Here is the story:

${FENCE}markdown
${serialise(t).trim()}
${FENCE}
${dependencyContext(t)}
Please do the work. Then reply with the COMPLETE updated story file in a single
${FENCE}markdown fenced block. Keep every field exactly as given unless a rule above
requires the change. Put any explanation before the block, not inside it.`;
}

/** Pull the story out of a pasted reply — fenced block preferred, bare frontmatter accepted. */
function extractStory(reply) {
  const text = String(reply || '').replace(/\r\n/g, '\n');
  const fenced = [...text.matchAll(/```(?:markdown|md)?\n([\s\S]*?)```/g)]
    .map((m) => m[1]).filter((b) => /^---\n/.test(b.trim()));
  const body = fenced.length ? fenced[fenced.length - 1] : text;
  const from = body.indexOf('---\n');
  return from < 0 ? null : parseTicket(body.slice(from));
}

const FIELD_DIFFS = ['title', 'stage', 'state', 'actor', 'priority', 'epic', 'feature',
  'work_type', 'increment', 'rev', 'parent', 'hold', 'defer_reason'];
const LIST_DIFFS = ['depends_on', 'tools', 'decisions'];

/** What would change, and what we are going to override. */
function diffStory(cur, next) {
  const rows = [];
  const guards = [];

  if (next.id !== cur.id) {
    guards.push(`The reply changed the id to ${next.id}. Ids are permanent, so ${cur.id} is kept.`);
  }
  if (next.state === 'done') {
    guards.push('The reply marked this done. Only you can accept work, so it is set to review instead.');
    next.state = 'review';
  }

  const keptLogs = cur.testLog.length;
  const newLogs = next.testLog.filter((e) =>
    !cur.testLog.some((o) => o.rev === e.rev && o.date === e.date && o.note === e.note && o.verdict === e.verdict));
  const dropped = cur.testLog.filter((o) =>
    !next.testLog.some((e) => e.rev === o.rev && e.date === o.date && e.note === o.note));
  if (dropped.length) {
    guards.push(`${dropped.length} existing Test Log entr${dropped.length === 1 ? 'y was' : 'ies were'} missing from the reply. The log is append-only, so ${dropped.length === 1 ? 'it is' : 'they are'} kept.`);
  }

  for (const f of FIELD_DIFFS) {
    const a = cur[f] === undefined ? '' : String(cur[f]);
    const b = next[f] === undefined ? '' : String(next[f]);
    if (a !== b) rows.push({ label: f, from: a || '—', to: b || '—' });
  }
  for (const f of LIST_DIFFS) {
    const a = (cur[f] || []).join(', '), b = (next[f] || []).join(', ');
    if (a !== b) rows.push({ label: f, from: a || '—', to: b || '—' });
  }
  for (const [f, label] of [['goal', 'Goal'], ['notes', 'Notes']]) {
    if ((cur[f] || '').trim() !== (next[f] || '').trim()) {
      rows.push({ label, from: cur[f] ? 'rewritten' : 'added', to: '' });
    }
  }
  for (const [f, label] of [['scope', 'Scope'], ['acceptance', 'Acceptance criteria']]) {
    if (cur[f].join('\n') !== next[f].join('\n')) {
      rows.push({ label, from: `${cur[f].length} item${cur[f].length === 1 ? '' : 's'}`,
                  to: `${next[f].length} item${next[f].length === 1 ? '' : 's'}` });
    }
  }
  if (newLogs.length) {
    rows.push({ label: 'Test Log', from: `${keptLogs} entries`, to: `${keptLogs + newLogs.length} entries` });
  }

  return { rows, guards, newLogs };
}

/** Merge an accepted reply into the story, enforcing the guards. */
function applyReply(cur, next, newLogs) {
  for (const f of FIELD_DIFFS) if (f !== 'rev') cur[f] = next[f];
  cur.rev = Math.max(cur.rev, next.rev || 1);
  for (const f of LIST_DIFFS) cur[f] = next[f] || [];
  cur.goal = next.goal;
  cur.notes = next.notes;
  cur.scope = next.scope;
  cur.acceptance = next.acceptance;
  cur.testLog = cur.testLog.concat(newLogs);       // append-only, always
  cur._extra = Object.assign({}, cur._extra, next._extra);
  markDirty(cur);
}

/* ---- panel ---- */

let bridgeReview = null;     // { next, diff } once a reply has been checked

function bridgeHTML() {
  const t = state.byId.get(state.bridgeId);
  if (!t) return '';

  const review = bridgeReview;
  const step3 = !review ? '' : review.error
    ? `<div class="banner stale"><b>That does not look like a story.</b> ${esc(review.error)}</div>`
    : `
      <div class="set-sect">
        <h3>3 &middot; What would change</h3>
        ${review.diff.guards.map((g) => `<div class="banner stale">${esc(g)}</div>`).join('')}
        ${review.diff.rows.length
          ? `<div class="bridge-diff">${review.diff.rows.map((r) => `
              <div class="bd-row">
                <span class="bd-k">${esc(r.label)}</span>
                <span class="bd-v">${esc(r.from)}</span>
                <span class="bd-a">→</span>
                <span class="bd-v to">${esc(r.to)}</span>
              </div>`).join('')}</div>`
          : '<p class="set-note">Nothing changed.</p>'}
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn primary" data-action="bridge-apply"${review.diff.rows.length ? '' : ' disabled'}>Apply to ${esc(t.id)}</button>
          <button class="btn" data-action="bridge-discard">Discard</button>
        </div>
      </div>`;

  return `
    <div class="set-sect">
      <h3>1 &middot; Copy this and paste it into any AI chat</h3>
      <p class="set-note">ChatGPT, Claude, Gemini — a free account is fine. Nothing is sent
        from here; you are carrying the message.</p>
      <textarea class="fi bridge-prompt" id="bridgePrompt" rows="12" readonly>${esc(buildPrompt(t))}</textarea>
      <div style="margin-top:8px"><button class="btn primary" data-action="bridge-copy">Copy prompt</button></div>
    </div>

    <div class="set-sect">
      <h3>2 &middot; Paste the reply back here</h3>
      <p class="set-note">Paste the whole reply. The board finds the story in it and shows you
        what would change before anything is applied.</p>
      <textarea class="fi" id="bridgeReply" rows="7" placeholder="Paste the AI's reply…"></textarea>
      <div style="margin-top:8px"><button class="btn" data-action="bridge-check">Check reply</button></div>
    </div>

    ${step3}`;
}

function openBridge(id) {
  state.bridgeId = id;
  bridgeReview = null;
  el('bridgeTitle').textContent = 'Ask an AI — ' + id;
  el('bridgeBody').innerHTML = bridgeHTML();
  el('bridgeBack').hidden = false;
}
function closeBridge() { el('bridgeBack').hidden = true; bridgeReview = null; }
function renderBridge() { el('bridgeBody').innerHTML = bridgeHTML(); }

function checkReply() {
  const cur = state.byId.get(state.bridgeId);
  const raw = (el('bridgeReply') || {}).value || '';
  if (!raw.trim()) { flash('Paste the reply first'); render(); return; }

  const next = extractStory(raw);
  if (!next) {
    bridgeReview = { error: 'Look for a fenced markdown block starting with three dashes, and paste that.' };
    renderBridge();
    return;
  }
  bridgeReview = { next, diff: diffStory(cur, next) };
  renderBridge();
}

function commitReply() {
  const cur = state.byId.get(state.bridgeId);
  if (!cur || !bridgeReview || bridgeReview.error) return;
  applyReply(cur, bridgeReview.next, bridgeReview.diff.newLogs);
  closeBridge();
  state.selectedId = cur.id;
  derive();
  flash(`${cur.id} updated from the reply — review it, then Save`);
  render();
}

/* ------------------------------------------------------------------- render()
   The single entry point. Nothing else writes to the DOM. */

let focusMemo = null;
let logoBroken = false;

function render() {
  // preserve caret position across re-render of the editor
  const a = document.activeElement;
  focusMemo = (a && a.dataset && a.dataset.field)
    ? { field: a.dataset.field, start: a.selectionStart, end: a.selectionEnd } : null;

  document.documentElement.dataset.theme = state.theme;
  document.body.dataset.density = state.density;
  el('appName').textContent = appName();
  el('projName').textContent = projectTitle();
  const sub = el('projSub');
  sub.textContent = state.settings.subtitle || '';
  sub.hidden = !state.settings.subtitle;
  const logo = el('brandLogo');
  const src = state.settings.logo || DEFAULT_LOGO;
  if (!logoBroken || state.settings.logo) {
    if (logo.getAttribute('src') !== src) logo.setAttribute('src', src);
    logo.hidden = false;
    el('brandDot').hidden = true;
  } else {
    logo.hidden = true;
    el('brandDot').hidden = false;
  }

  const view = state.view;
  el('bodyGrid').hidden = view !== 'board';
  el('planView').hidden = view !== 'plan';
  el('docsView').hidden = view !== 'docs';
  el('toolbar').style.display = view === 'docs' ? 'none' : '';

  // Level applies to the plan; lanes/density/sort apply to the board.
  const onPlan = view === 'plan';
  el('levelGroup').style.display = onPlan ? '' : 'none';
  for (const id of ['laneGroup', 'densityGroup', 'sortGroup']) {
    const g = el(id);
    if (g) g.style.display = onPlan ? 'none' : '';
  }

  if (onPlan) el('planView').innerHTML = planHTML();
  if (view === 'docs') {
    el('docList').innerHTML = docListHTML();
    el('docMain').innerHTML = docMainHTML();
  }

  el('stats').innerHTML = statsHTML();
  el('rail').innerHTML = railHTML();
  el('board').innerHTML = boardHTML();
  el('detail').innerHTML = detailHTML();

  const grid = el('bodyGrid');
  grid.classList.toggle('detail-on', !!state.byId.get(state.selectedId));
  grid.classList.toggle('rail-off', !state.railOn);

  for (const [action, cur] of [['lane', state.lane], ['density', state.density],
                              ['sort', state.sort], ['view', state.view],
                              ['planlevel', state.planLevel]]) {
    for (const b of document.querySelectorAll(`[data-action="${action}"]`)) {
      b.setAttribute('aria-pressed', String(b.dataset.v === cur));
    }
  }

  const save = el('saveBtn');
  save.innerHTML = state.tickets_dirty ? '<i class="dirty-dot"></i> Save *' : 'Save';
  save.disabled = !state.tickets_dirty;

  const shown = visible().length;
  el('footNote').innerHTML = state.flash
    ? `<span class="saved-pulse">${esc(state.flash)}</span>`
    : `${shown} of ${state.tickets.length} shown · ${esc(state.source)} · local-first, nothing leaves this device`;

  if (focusMemo) {
    const node = document.querySelector(`[data-field="${focusMemo.field}"]`);
    if (node && node.setSelectionRange) {
      node.focus();
      try { node.setSelectionRange(focusMemo.start, focusMemo.end); } catch (_) { /* selects */ }
    }
  }
}

function syncFilterOptions() {
  const fill = (id, values, current) => {
    const sel = el(id);
    const first = sel.options[0];
    sel.innerHTML = '';
    sel.appendChild(first);
    for (const v of values) {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      if (v === current) o.selected = true;
      sel.appendChild(o);
    }
  };
  fill('fActor', [...new Set(state.tickets.map((t) => t.actor))].sort(), state.fActor);
  fill('fPriority', [...new Set(state.tickets.map((t) => t.priority))].sort(), state.fPriority);
}

/* ---------------------------------------------------------- delegated events */

document.addEventListener('click', (ev) => {
  const actionEl = ev.target.closest('[data-action]');
  if (actionEl) {
    const { action, v } = actionEl.dataset;
    const t = state.byId.get(state.selectedId);

    switch (action) {
      case 'lane':    state.lane = v; savePrefs(); break;
      case 'density': state.density = v; savePrefs(); break;
      case 'sort':    state.sort = v; savePrefs(); break;
      case 'theme':   state.theme = state.theme === 'dark' ? 'light' : 'dark'; savePrefs(); break;
      case 'rail':    state.railOn = !state.railOn; savePrefs(); break;
      case 'feature': state.fFeature = v || ''; break;
      case 'view':    state.view = v; savePrefs(); break;
      case 'doc':     state.activeDoc = v; break;
      case 'planlevel': state.planLevel = v; savePrefs(); break;
      case 'bridge':         if (state.selectedId) openBridge(state.selectedId); return;
      case 'bridge-close':   closeBridge(); return;
      case 'bridge-check':   checkReply(); return;
      case 'bridge-apply':   commitReply(); return;
      case 'bridge-discard': bridgeReview = null; renderBridge(); return;
      case 'bridge-copy': {
        const box = el('bridgePrompt');
        navigator.clipboard.writeText(box.value)
          .then(() => { flash('Prompt copied — paste it into any AI chat'); render(); })
          .catch(() => { box.select(); flash('Press Cmd/Ctrl-C to copy'); render(); });
        return;
      }
      case 'settings':       openSettings(); return;
      case 'settings-close': closeSettings(); render(); return;
      case 'logo-pick':      el('logoInput').click(); return;
      case 'logo-clear':     setSetting('logo', ''); renderSettings(); render(); return;
      case 'settings-reset':
        if (!confirm('Reset the board name, project title, subtitle, logo and every label to defaults?')) return;
        state.settings = blankSettings();
        persistSettings(); renderSettings(); render(); flash('Settings reset');
        return;
      case 'settings-copy':
        navigator.clipboard.writeText(settingsAsYaml())
          .then(() => { flash('AGENTS.md block copied'); render(); })
          .catch(() => alert(settingsAsYaml()));
        return;
      case 'close':   state.selectedId = null; break;
      case 'demo':    loadSeed(state.seed); return;
      case 'open':    openFromDisk(); return;
      case 'save':    saveAll(); return;
      case 'new':     newStory(); return;
      case 'bump':    if (t) { t.rev += 1; t._sig = revSig(t); markDirty(t); flash(`${t.id} bumped to r${t.rev}`); } break;
      case 'addtest': if (t) addTest(t); break;
      case 'delete':  if (t) deleteStory(t); return;
      default: return;
    }
    derive();
    render();
    return;
  }

  if (ev.target.id === 'bridgeBack') { closeBridge(); return; }
  if (ev.target.id === 'settingsBack') { closeSettings(); render(); return; }

  const planRow = ev.target.closest('[data-planrow]');
  if (planRow) {
    const id = planRow.dataset.planrow;
    if (state.planLevel === 'story') {
      state.selectedId = state.selectedId === id ? null : id;
      state.view = 'board';
    } else if (state.planLevel === 'feature') {
      state.fFeature = state.fFeature === id ? '' : id;
    }
    render();
    return;
  }

  const link = ev.target.closest('[data-doclink]');
  if (link) {
    ev.preventDefault();
    const f = link.dataset.doclink;
    if (state.docs[f]) { state.activeDoc = f; render(); }
    return;
  }

  const card = ev.target.closest('[data-card]');
  if (card) {
    const id = card.dataset.card;
    state.selectedId = state.selectedId === id ? null : id;
    render();
  }
});

/* ------------------------------------------------------------ drag and drop
   Delegated like everything else — cards are rebuilt on every render, so
   nothing is bound per card.

   A drop target is a (state, lane) pair, so dragging across a swimlane moves
   both dimensions at once: Plan/Review → Build/To Do promotes the story into
   build, and in Actor lanes a drag between AI and Human *is* the handoff.

   The editor dropdowns remain the keyboard-accessible path (DESIGN.md §3.3). */

let dragId = null;
let dropZone = null;

function clearDrag() {
  const card = document.querySelector('.card.dragging');
  if (card) card.classList.remove('dragging');
  if (dropZone) dropZone.classList.remove('drop-over');
  document.body.classList.remove('is-dragging');
  dragId = null;
  dropZone = null;
}

function setZone(zone) {
  if (dropZone === zone) return;
  if (dropZone) dropZone.classList.remove('drop-over');
  dropZone = zone;
  if (zone) zone.classList.add('drop-over');
}

/** Apply a drop. `spec` is "state|laneAxis|laneId". Returns a description, or null. */
function applyDrop(id, spec) {
  const t = state.byId.get(id);
  if (!t) return null;

  const [nextState, laneAxis, laneId] = String(spec).split('|');
  if (!STATES.some((s) => s.id === nextState)) return null;

  const moves = [];

  if (t.state !== nextState) {
    moves.push(`${t.state} → ${nextState}`);
    t.state = nextState;
  }

  if (laneAxis === 'stage' && laneId && t.stage !== laneId) {
    moves.push(`${t.stage} → ${laneId}`);
    t.stage = laneId;
  }
  if (laneAxis === 'actor' && laneId && t.actor !== laneId) {
    moves.push(`handed ${t.actor} → ${laneId}`);
    t.actor = laneId;
  }
  if (laneAxis === 'increment' && laneId) {
    const next = laneId === 'Unscheduled' ? '' : laneId;
    if ((t.increment || '') !== next) {
      moves.push(`${t.increment || 'unscheduled'} → ${next || 'unscheduled'}`);
      t.increment = next;
    }
  }

  // AGENTS.md §5: deferred is a parking status — work cannot start from it.
  // Dragging a parked story onto the board is an explicit decision to un-park it,
  // and counts as a change on its own even if the column is unchanged.
  if (t.hold === 'deferred') {
    t.hold = '';
    delete t.defer_reason;
    delete t.revisit_trigger;
    moves.push('un-parked');
  }
  // `blocked` is a fact about the world, not a parking choice — it survives a move.

  if (!moves.length) return null;

  markDirty(t);
  return `${t.id} · ${moves.join(' · ')}`;
}

document.addEventListener('dragstart', (ev) => {
  const card = ev.target.closest && ev.target.closest('[data-card]');
  if (!card) return;
  dragId = card.dataset.card;
  card.classList.add('dragging');
  document.body.classList.add('is-dragging');
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    try { ev.dataTransfer.setData('text/plain', dragId); } catch (_) { /* Safari */ }
  }
});

document.addEventListener('dragover', (ev) => {
  if (!dragId) return;
  const zone = ev.target.closest && ev.target.closest('[data-drop]');
  if (!zone) { setZone(null); return; }
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
  setZone(zone);
});

document.addEventListener('drop', (ev) => {
  if (!dragId) return;
  const zone = ev.target.closest && ev.target.closest('[data-drop]');
  const id = dragId;
  if (!zone) { clearDrag(); return; }
  ev.preventDefault();

  const t = state.byId.get(id);
  const wasTest = t && t._test;
  const msg = applyDrop(id, zone.dataset.drop);
  clearDrag();

  if (!msg) return;

  state.selectedId = id;
  derive();
  render();

  // Non-blocking nudge: accepting work whose evidence does not cover the
  // current revision. The human is still the gate — this only says so out loud.
  const moved = state.byId.get(id);
  if (moved && moved.state === 'done' && wasTest !== 'verified') {
    flash(`${msg} — note: test is ${wasTest}, not verified`);
  } else {
    flash(msg);
  }
  render();
});

document.addEventListener('dragend', clearDrag);

/* Editor writes. One listener, routed by data-field. */
function applyField(t, field, value) {
  if (field === 'scope' || field === 'acceptance') {
    t[field] = value.split('\n').map((s) => s.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim()).filter(Boolean);
  } else if (field === 'depends_on' || field === 'tools' || field === 'decisions') {
    t[field] = value.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (field.startsWith('wsjf_')) {
    t[field] = Number(value) || 0;
  } else {
    t[field] = value;
  }
  markDirty(t);
}

document.addEventListener('input', (ev) => {
  const node = ev.target;
  if (node.id === 'q') { state.q = node.value; render(); return; }
  if (node.id === 'bridgeReply') return;
  if (node.dataset && node.dataset.setting) {
    setSetting(node.dataset.setting, node.value);
    render();               // labels are display-only, so a re-render is the whole effect
    return;
  }
  if (!node.dataset || !node.dataset.field) return;

  const t = state.byId.get(state.selectedId);
  if (!t) return;
  applyField(t, node.dataset.field, node.value);
  derive();

  // Re-render only what the edit can affect, so typing stays smooth.
  el('stats').innerHTML = statsHTML();
  el('board').innerHTML = boardHTML();
  const save = el('saveBtn');
  save.innerHTML = '<i class="dirty-dot"></i> Save *';
  save.disabled = false;
});

document.addEventListener('change', (ev) => {
  const node = ev.target;
  if (node.id === 'logoInput') { pickLogo(node.files && node.files[0]); return; }
  if (node.dataset && node.dataset.settingBool) {
    setSetting(node.dataset.settingBool, !node.checked);   // checkbox reads "Show", stores "hide"
    if (state.settings.hideAbout && state.activeDoc === ABOUT_KEY) {
      state.activeDoc = DOC_SLOTS.map((d) => d.file).find((f) => state.docs[f]) || '';
    } else if (!state.settings.hideAbout) {
      state.activeDoc = ABOUT_KEY;
    }
    renderSettings(); render(); return;
  }
  const map = { fActor: 'fActor', fPriority: 'fPriority', fTest: 'fTest' };
  if (map[node.id]) { state[map[node.id]] = node.value; render(); return; }
  if (node.id === 'cHandoff') { state.onlyHandoff = node.checked; render(); return; }
  if (node.id === 'cParked')  { state.showParked = node.checked; render(); return; }
  if (node.id === 'seedPick') {
    if (state.tickets_dirty && !confirm('You have unsaved edits. Load a different backlog and lose them?')) {
      node.value = state.seed; return;
    }
    state.tickets.forEach((x) => { x._dirty = false; });
    loadSeed(node.value); return;
  }

  // selects in the editor need a full re-render (they can reveal fields)
  if (node.dataset && node.dataset.field) {
    const t = state.byId.get(state.selectedId);
    if (!t) return;
    applyField(t, node.dataset.field, node.value);
    derive();
    render();
  }
});

document.addEventListener('keydown', (ev) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);

  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveAll(); return; }
  if (ev.key === 'Escape') {
    if (!el('bridgeBack').hidden) { closeBridge(); return; }
    if (!el('settingsBack').hidden) { closeSettings(); render(); return; }
    if (typing) { ev.target.blur(); return; }
    state.selectedId = null; render(); return;
  }
  if (typing) return;

  if (ev.key === '/') { ev.preventDefault(); el('q').focus(); return; }
  const cycle = (key, arr) => {
    state[key] = arr[(arr.indexOf(state[key]) + 1) % arr.length];
    savePrefs(); render();
  };
  if (ev.key.toLowerCase() === 'l') cycle('lane', ['stage', 'actor', 'increment', 'none']);
  else if (ev.key.toLowerCase() === 'd') cycle('density', ['compact', 'standard', 'full']);
});

/* -------------------------------------------------------------- ticket ops */

function addTest(t) {
  const verdict = (el('tlVerdict') || {}).value || 'pass';
  const raw = ((el('tlNote') || {}).value || '').trim();
  const parts = raw.split('·').map((s) => s.trim()).filter(Boolean);
  t.testLog.push({
    rev: t.rev,
    date: TODAY(),
    verdict,
    method: parts[0] || 'manual',
    actor: t.actor,
    note: parts.slice(1).join(' · ')
  });
  markDirty(t);
  flash(`Test recorded on ${t.id} at r${t.rev}`);
}

function nextId() {
  const nums = state.tickets
    .map((t) => parseInt(String(t.id).replace(/^\D+/, ''), 10))
    .filter((n) => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return 'T-' + String(n).padStart(3, '0');
}

function newStory() {
  const id = nextId();
  const t = parseTicket(`---
id: ${id}
title: New story
stage: plan
state: todo
actor: AI
priority: P2
feature: Unassigned
work_type: business
rev: 1
---

## Goal

## Acceptance Criteria
`);
  t._dirty = true;
  t._isNew = true;
  state.tickets.push(t);
  state.selectedId = id;
  derive();
  render();
  const title = document.querySelector('[data-field="title"]');
  if (title) { title.focus(); title.select(); }
}

function deleteStory(t) {
  if (t._children.length) {
    alert(`${t.id} has ${t._children.length} task(s) beneath it. Reassign or delete those first.`);
    return;
  }
  if (!confirm(`Delete ${t.id} — "${t.title}"?\n\nIf it was loaded from disk the file is not removed; delete it there too.`)) return;
  state.tickets = state.tickets.filter((x) => x.id !== t.id);
  state.selectedId = null;
  derive();
  render();
  flash(`${t.id} removed from the board`);
}

/* ------------------------------------------------------------- index writer
   The board regenerates tasks/INDEX.md on every save.

   Splitting a backlog into one file per story only works if the index is
   trustworthy — a stale index is worse than no index, because an agent will
   believe it. So the board owns it: nobody hand-maintains it, and the header
   carries a story count and a date so drift is *detectable* rather than silent.
   AGENTS.md §9 tells agents to regenerate when the count disagrees.          */

const IDX_COLS = ['ID', 'Title', 'Feature', 'Stage', 'State', 'Actor', 'Pri',
                  'WSJF', 'Increment', 'Rev', 'Test', 'Blocked-By'];

function indexRow(t) {
  return [
    t.id,
    (t.title || '').replace(/\|/g, '\\|'),
    t.feature || '-',
    t.stage,
    t.state,
    t.actor,
    t.priority,
    t._wsjf === null || t._wsjf === undefined ? '-' : String(t._wsjf),
    t.increment || '-',
    'r' + t.rev,
    t._test === 'stale' ? `stale r${t._testedAt}` : t._test,
    t.depends_on.length ? t.depends_on.join(', ') : '-'
  ];
}

function indexTable(rows) {
  if (!rows.length) return ['_none_', ''];
  return [
    '| ' + IDX_COLS.join(' | ') + ' |',
    '|' + IDX_COLS.map(() => '---').join('|') + '|',
    ...rows.map((t) => '| ' + indexRow(t).join(' | ') + ' |'),
    ''
  ];
}

function buildIndex() {
  const all = state.tickets.slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const active = all.filter((t) => !t.hold && t.state !== 'done');
  const parked = all.filter((t) => t.hold === 'deferred');
  const blocked = all.filter((t) => t.hold === 'blocked');
  const done = all.filter((t) => t.state === 'done');
  const ready = active.filter((t) => t.state === 'todo' && !t._unmet.length);
  const needsYou = all.filter((t) => t._handoff === 'to-human');
  const stale = all.filter((t) => t._test === 'stale');

  const L = [
    `# Task Index — ${projectTitle()}`, '',
    '**Generated by the board. Never edit this file by hand** — edit the story in',
    '`tasks/` and save, and this is rewritten.', '',
    `Stories: ${all.length} · Active: ${active.length} · Blocked: ${blocked.length} · ` +
    `Parked: ${parked.length} · Done: ${done.length}`,
    `Generated: ${TODAY()}`, '',
    '> If the story count above does not match the number of `T-*.md` files in this folder,',
    '> this index is out of date — regenerate it before trusting it.', '',
    '---', '', '## Active', '',
    'Not done, not parked. **Read this section only, unless you have a reason.**', '',
    ...indexTable(active),
    `**Ready now** (todo, unblocked): ${ready.map((t) => t.id).join(', ') || 'none'}`, '',
    `**Waiting on a human** (in review): ${needsYou.map((t) => t.id).join(', ') || 'none'}`, ''
  ];

  if (stale.length) {
    L.push(`**Stale test evidence** — treat as untested: ${stale.map((t) => t.id).join(', ')}`, '');
  }
  if (blocked.length) {
    L.push('---', '', '## Blocked', '', ...indexTable(blocked));
  }
  L.push('---', '', '## Parked', '',
    'Deferred work. Read when planning, not when working.', '', ...indexTable(parked));
  L.push('---', '', '## Done', '', ...indexTable(done));

  return L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/* -------------------------------------------------------------- load / save */

function ingest(mdList, { project, source, dirHandle = null, handles = null, docs = null }) {
  const parsed = mdList.map(parseTicket).filter(Boolean);
  if (!parsed.length) {
    alert('No stories found. Each file needs YAML frontmatter with at least an `id` — see AGENTS.md §3.');
    return;
  }
  if (handles) parsed.forEach((t, i) => { t._fh = handles[i] || null; });

  state.tickets = parsed;
  state.project = project;
  state.settingsKey = source;
  loadSettings();
  state.source = source;
  state.dirHandle = dirHandle;
  state.docs = docs || {};
  state.activeDoc = state.settings.hideAbout
    ? (DOC_SLOTS.map((d) => d.file).find((f) => state.docs[f]) || '')
    : ABOUT_KEY;
  state.selectedId = null;
  state.fFeature = '';
  derive();
  syncFilterOptions();
  render();
}

function loadSeed(key) {
  const seed = SEEDS[key] || SEEDS.vibe;
  state.seed = SEEDS[key] ? key : 'vibe';
  ingest(seed.tickets(), { project: seed.project, source: seed.label, docs: seed.docs() });
  const pick = el('seedPick');
  if (pick) pick.value = state.seed;
  flash(seed.hint);
  render();
}

async function openFromDisk() {
  try {
    if (!window.showDirectoryPicker) {
      alert('This browser cannot open local folders. Use Chrome, Edge or Arc — or click Demo.');
      return;
    }
    const dir = await window.showDirectoryPicker({ mode: 'readwrite' });

    // prefer a tasks/ subfolder if the AGENTS.md §1 layout is present
    let target = dir;
    for await (const [name, handle] of dir.entries()) {
      if (name === 'tasks' && handle.kind === 'directory') { target = handle; break; }
    }

    // Project documents always come from the folder root, whether or not
    // stories live in a tasks/ subfolder.
    const docs = {};
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind !== 'file' || !name.endsWith('.md')) continue;
      if (/^INDEX\.md$/i.test(name)) continue;
      const text = await (await handle.getFile()).text();
      if (!/^---\n[\s\S]*?\nid:/m.test(text)) docs[name] = text;   // not a story file
    }

    const texts = [], handles = [];
    for await (const [name, handle] of target.entries()) {
      if (handle.kind !== 'file' || !name.endsWith('.md')) continue;
      if (/^INDEX\.md$/i.test(name) || docs[name] !== undefined) continue;
      const text = await (await handle.getFile()).text();
      if (!parseTicket(text)) continue;
      texts.push(text);
      handles.push(handle);
    }
    if (!texts.length) { alert('No story files (*.md with frontmatter and an id) found in that folder.'); return; }

    ingest(texts, { project: dir.name, source: dir.name + '/', dirHandle: target, handles, docs });
    flash(`Opened ${texts.length} stories from ${dir.name}`);
    render();
  } catch (err) {
    if (err && err.name !== 'AbortError') alert('Could not open: ' + err.message);
  }
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function saveAll() {
  const dirty = state.tickets.filter((t) => t._dirty);
  if (!dirty.length) { flash('Nothing to save'); render(); return; }

  // No folder open (demo, or a browser without the API) → hand back files.
  if (!state.dirHandle) {
    dirty.forEach((t) => download(`${t.id}.md`, serialise(t)));
    download('INDEX.md', buildIndex());
    flash(`Downloaded ${dirty.length} file${dirty.length > 1 ? 's' : ''} + INDEX.md — open a folder to save in place`);
    dirty.forEach((t) => { t._dirty = false; });
    derive(); render();
    return;
  }

  try {
    for (const t of dirty) {
      let fh = t._fh;
      if (!fh) fh = await state.dirHandle.getFileHandle(`${t.id}.md`, { create: true });
      const w = await fh.createWritable();
      await w.write(serialise(t));
      await w.close();
      t._fh = fh;
      t._dirty = false;
      t._isNew = false;
    }
    // The index is ours to maintain — a stale one is worse than none.
    const ih = await state.dirHandle.getFileHandle('INDEX.md', { create: true });
    const iw = await ih.createWritable();
    await iw.write(buildIndex());
    await iw.close();

    flash(`Saved ${dirty.length} file${dirty.length > 1 ? 's' : ''} + INDEX.md to ${state.project}`);
  } catch (err) {
    alert('Save failed: ' + err.message);
  }
  derive();
  render();
}

window.addEventListener('beforeunload', (e) => {
  if (state.tickets_dirty) { e.preventDefault(); e.returnValue = ''; }
});

/* ---------------------------------------------------------------------- boot */

loadPrefs();
state.settings = blankSettings();

// If assets/icon.png is not there yet, quietly fall back to the accent dot.
{
  const logoEl = el('brandLogo');
  if (logoEl) {
    logoEl.addEventListener('error', () => {
      if (state.settings.logo) return;      // a custom logo failing is the user's problem to see
      logoBroken = true;
      logoEl.hidden = true;
      el('brandDot').hidden = false;
    });
  }
}
loadSeed('vibe');
