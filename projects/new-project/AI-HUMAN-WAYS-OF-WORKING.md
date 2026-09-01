# AI–Human ways of working

How to work with an AI on a piece of work so that it survives the chat window.

A conversation is a terrible place to keep a project. It is long, unsearchable, invisible to
anyone else, and gone when the thread ends. Everything here exists to move the durable parts
of a conversation into files — without turning the work into paperwork.

---

## The shape of it

```
your-project/
├── AGENTS.md          who does what, and the rules            ← short
├── CLAUDE.md          the working context                     ← the real content
├── DESIGN.md          how it works and why                    ← when CLAUDE.md gets full
├── DECISIONS.md       choices that changed something          ← thin on purpose
└── tasks/
    ├── INDEX.md       generated — one row per story
    └── T-001.md …     one story per file
```

Two rules make it work:

1. **The folder is the integration.** Your AI edits these files; the board reads them. There
   is no API and nothing to connect. Point both at the same folder and they are working
   together.
2. **The chat is where thinking happens. The files are what survives it.** Nothing here asks
   you to stop talking to the AI — it asks the AI to write things down as it goes.

---

## When to write the files

**Roughly five to ten messages into the conversation.** Not the first message, not the
twentieth.

- **Too early** and you are documenting a project you have not understood yet. You will
  write confident nonsense and then feel obliged to honour it.
- **Too late** and the context lives only in a thread nobody will re-read, and the next
  session starts cold.

The signal to write them is: *you have stopped changing your mind about what this is.*
That is usually around the point where the AI has produced something you have reacted to.

---

## The files, and what actually goes in them

### AGENTS.md — a pointer, not a manual

**Keep it short.** Its job is to tell any AI, in the first thirty seconds, how work happens
here — and then point at `CLAUDE.md` for everything else.

Short matters because this is the file **every** assistant reads. Claude, Codex, Gemini and
whatever comes next all look for it or something like it. A short pointer stays true across
all of them; a long one becomes a maintenance burden written for whichever tool you used
first.

What goes in:
- how to find work (read the index, pick one, read that one file)
- what "done" means, and who decides — **a person, never the AI**
- what must never be touched (generated files)
- a line saying: read `CLAUDE.md` for context and house rules

### CLAUDE.md — the working context

This is where the content lives. Not what the project *is* (that is the README) — how to
**work on it**.

What goes in:
- the constraints that are non-negotiable, **with their reasons**
- house rules you have learned the hard way
- where the project currently stands and what is next

A rule without a reason gets "improved" away by whoever reads it next, human or otherwise.
Write the reason.

### Keep CLAUDE.md light

When it starts sprawling, **split rather than scroll**. A file that is too long stops being
read — by people and by models, which will skim it or drop it from context.

Split it into whichever of these earns its place:

| File | When to create it |
|---|---|
| `DESIGN.md` | Behaviour and reasoning are taking over CLAUDE.md |
| `DATA-MODEL.md` | You are describing entities and fields more than once |
| `ARCHITECTURE.md` | Technology choices need their own argument |
| `ROADMAP.md` | You keep saying "not yet" and want to remember why |

CLAUDE.md then keeps a one-line pointer to each. It stays a map, not a manual.

### DECISIONS.md — thin by design

Record a decision **only** if it changed the timeline, the scope, the risk, or the cost.

If you cannot pick one of those four, it is a note on a story, not a decision. That single
gate is what keeps the log worth reading. A large unorganised decision log is worse than
none — nobody opens it, so nothing is protected by it.

Six lines each: what, when, which impact, why in one sentence, what was rejected, and which
stories it touches.

---

## How work is tracked

**One story per file.** Small enough to finish in about a day, with a goal and acceptance
criteria a person could check.

**`tasks/INDEX.md` is generated.** One row per story so an assistant can see the whole
backlog for a few hundred tokens and then open only the one file it needs. Nobody edits it
by hand; the board rewrites it on save.

Why bother splitting? Because a single growing task file eventually costs more context than
the work does, and because per-story history becomes real — you can see how one story
changed without reading a diff of everything.

---

## Where the AI's own notes go

This is the question that trips people up. An assistant working properly generates a lot of
intermediate state — a plan for the session, sub-steps, orientation notes. Most of it is not
something a human wants in their backlog.

**You do not need a parallel system.** Three places absorb it:

1. **Decomposition becomes sub-tasks.** When the AI breaks a story into steps, those are
   Tasks under the Story, using the same format. On the board, viewing at Story level hides
   them; at Task level they appear. It is a zoom control, not a second backlog.
2. **Orientation notes go in the story.** A `## Working notes` section is the AI's scratch
   space, next to the work it belongs to, and ignorable.
3. **Continuity comes from the board, not a journal.** If the assistant keeps states, actors
   and the Test Log accurate, it does not need private notes to find its place next session —
   the index already says what is in flight and what is waiting.

That third point is the important one. **An AI that maintains the board does not need a
memory of its own.** If it is keeping a private journal to stay oriented, the board is not
being kept accurate, and that is the thing to fix.

---

## The handoff

Work passes back and forth. Make the pass explicit.

- The AI finishes at **review**, never at **done**. Review means *claimed* done.
- A person accepts. That is the whole gate, and it is not a formality — it is the only point
  at which anyone checks that the thing asked for is the thing built.
- Say who holds a story. Some work is genuinely shared: writing the project files is a
  conversation, not a task. Mark that **Both** and stop pretending it has one owner.

---

## Evidence, and why revisions matter

"It works" is not evidence. A dated line saying what was checked, by whom, at which revision
is.

Every story carries a revision number. **Change its goal, scope or acceptance criteria and
the number goes up** — and every earlier test result is automatically marked **stale**.

That sounds fussy until it saves you. The common failure with an AI is not a wrong answer;
it is a *right answer to the previous question*. Something passed, the story then changed,
and the pass silently kept looking valid. Binding evidence to a revision makes that visible
instead of invisible.

The Test Log is append-only. You never delete a failure — a story that failed twice before
passing is telling you something.

---

## Parking things properly

Deferred work is an asset, not a bin. Record **why**:

| Reason | Meaning |
|---|---|
| `complexity` | Not understood well enough yet |
| `size` | Understood, too big for now |
| `risk` | Could break something that works |
| `value` | Cost and benefit not demonstrated |
| `dependency` | Waiting on something external |

Plus a revisit trigger — a condition, not a date. *"When we break the same thing twice."*

Group parked work by reason and it starts telling you things. Five items parked on `size`
means something needs decomposing. Five on `complexity` means you need a spike.

---

## Keeping it current

Documents rot silently. Two habits stop it:

1. **CLAUDE.md carries the instruction to check.** Put it in writing: *at the start of a
   session, or after any significant change, confirm these files still describe reality.*
   An assistant will do this if asked and will not if it is not.
2. **Write the update when the decision is made**, not later. The five minutes right after a
   choice is the only time you remember why.

The test for whether it is working: **could someone else — or the same AI in a fresh session
with no history — pick this up from the files alone?** If not, the gap you just found is the
thing to write down.

---

## The short version

1. Files, not chat history.
2. Write them five to ten messages in.
3. AGENTS.md points; CLAUDE.md carries; split before either gets fat.
4. One story per file; the index is generated.
5. The AI stops at review. A person accepts.
6. Evidence is dated and tied to a revision.
7. Record decisions that cost something; park the rest with a reason.
8. Ask, at intervals, whether any of it is still true.
