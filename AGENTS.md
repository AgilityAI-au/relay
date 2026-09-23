# AGENTS.md — Task Contract

The contract for how work is recorded in this project. **Both the board UI and any AI agent read
this file.** One declaration, two consumers — that is what stops the folder structure drifting
away from what the AI expects.

Point the board at any folder containing an `AGENTS.md` with this shape and it configures itself.

> **Status:** specified for v4, not yet implemented. `kanban-3` still reads a single `TASKS.md`.

---

## 1. Folder layout

```
AGENTS.md          this contract
CLAUDE.md          how to work on the project
README.md          what this is
DESIGN.md          how it behaves and why
DECISIONS.md       the decision log
TASKS.md           every active and parked story, one block each
TASKS-DONE.md      finished work, kept for the record
```

Flat, and readable without any tool. **`TASKS.md` is the backlog** — a human can scroll it,
GitHub renders it, and an agent reads the whole thing in one go.

### Why not one file per story
It only pays if you have a tool or a CLI to query the folder. Without one, a hundred files is
hostile to anyone browsing the project, and any whole-backlog question costs an agent a tool
call per story. It also forces an index into existence — a cache, which can go stale. With the
stories in one file, **the file is the list**.

> **The older split layout is still read.** A folder with `tasks/*.md` and an `INDEX.md` opens
> and saves in that shape, so existing projects keep working. New folders get the two files.

---

## 2. Vocabulary — SAFe / JIRA / Azure DevOps

The board uses the words a scrum master or RTE already knows. Nothing here is invented.

| Term | What it is here | Authored? |
|---|---|---|
| **Epic** | Portfolio-level initiative. The `epic` label. | Label only — no epic record to maintain |
| **Feature** | ART-level grouping. The `feature` label. | Label only |
| **Story** | A ticket with no `parent`. The unit of work. | Yes — one block in `TASKS.md` |
| **Task** | A ticket **with** a `parent`. Breakdown of a story. | Yes — same block format |
| **Enabler** | `work_type: enabler` — architectural runway rather than business value. | Field value |
| **PI** | Program Increment. The `increment` label, e.g. `PI-2`. | Label only |
| **WSJF** | Weighted Shortest Job First. Derived — see §2.4. | Four optional scores |

Epic → Feature → Story → Task is the Azure DevOps *Agile* hierarchy exactly, and SAFe's team-level
shape. Epic and Feature are **derived groupings**, so moving work between them means changing a
label — there is no epic table to keep in step.

---

## 3. The field model

Two axes and two flags. Every field below is set on essentially every ticket; that is the test for
whether a field earns its place.

### Axis 1 — `stage`: where in the thinking
| Value | Meaning |
|---|---|
| `plan` | Specs, architecture, decisions. Sketching and chunking. |
| `build` | Code, tests, implementation. |

Build work is gated behind planning: a `build` ticket should not reach `doing` while a `plan`
ticket at P0/P1 in the same `feature` is unfinished.

### Axis 2 — `state`: how it is going
`todo` → `doing` → `review` → `done`

No skipping `doing`. `review` means acceptance criteria are claimed met and a human has not yet
agreed.

### `actor`: who holds it
`AI` | `Human` | `Both`. This drives the actor swimlane split, which is the point of the
board — see §6.

`Both` is for work that is a conversation rather than a task: the human steers, the AI
writes, and it is never quite finished. Writing the project files is the clearest case.
**A `Both` story is never "ready to dispatch"** — it always needs a person.

### Supporting fields
| Field | Values | Notes |
|---|---|---|
| `priority` | `P0` `P1` `P2` | P0 highest. Always set — the fallback when WSJF is not scored. |
| `epic` | free label | Portfolio grouping. Optional; omit on small projects. |
| `feature` | free label | ART-level grouping. Always set. |
| `work_type` | `business` \| `enabler` \| `bug` \| `chore` | SAFe's value split: business value now vs architectural runway. |
| `increment` | free label, e.g. `PI-2` | Program Increment. Optional; enables the PI swimlane. |
| `rev` | integer, starts at 1 | See §4. Critical. |
| `parent` | story id or absent | Present ⇒ this is a Task, not a Story. |
| `depends_on` | story ids | Must be `done` first. A dependency in `review` is **not** met — a human has not accepted it yet. |
| `tools` | list from the tool library | What this work needs. Selected from a picker, never typed. |

### 2.4 WSJF — optional, derived
SAFe prioritises by **Weighted Shortest Job First**: `WSJF = Cost of Delay ÷ Job Size`, where
Cost of Delay = Business Value + Time Criticality + Risk Reduction / Opportunity Enablement.

Four optional scores on the modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20):

```yaml
wsjf_bv: 8      # business value
wsjf_tc: 13     # time criticality
wsjf_rr: 5      # risk reduction / opportunity enablement
wsjf_size: 3    # job size
```

The board computes and displays the score and can sort by it. **Score all four or none** — a
partial set is ignored. Unscored work falls back to `priority`, so small projects can skip WSJF
entirely without the board degrading.

### Flags — usually absent, high signal when present
| Flag | Values |
|---|---|
| `hold` | `blocked` \| `deferred` |
| `defer_reason` | required when `hold: deferred` — see §4 |
| `revisit_trigger` | required when `hold: deferred` — date, milestone or condition |

`blocked` and `deferred` are **not states**. They are interrupts that can apply at any state, so
they are flags, not column values. A flag being empty most of the time is fine — the rule about
fields earning their place is about avoiding many *similar* fields, not about exception markers.

---

## 4. Revisions and test evidence — read this one carefully

**The failure mode being prevented:** an agent reads "tested: pass" on a ticket, and assumes the
work is done — but the ticket's scope was edited after that test ran. The pass is real and
worthless.

### The rule
- Every ticket carries `rev`, an integer starting at 1.
- **Bump `rev` on any material change to Goal, Scope or Acceptance Criteria.**
- Do *not* bump for typos, notes, status changes, or `actor` handoffs.
- **`id` never changes.** Cross-references (`parent`, `depends_on`, decision links) depend on
  stable ids, so the revision is a separate field — not part of the id. Display them together
  (`T-004 · r3`) if that reads better.

### The Test Log
An append-only list in the ticket body. Never edit or delete an entry.

```
## Test Log
- r1 · 2026-08-28 · pass · manual · Human · basic flow works
- r3 · 2026-08-30 · fail · manual · Human · breaks when column collapsed
- r3 · 2026-08-30 · pass · manual · AI · fixed, re-verified
```

Format: `rev · date · pass|fail · method · actor · note`

### Derived test status — never hand-maintained
| Status | Condition |
|---|---|
| `untested` | no `pass` entry at any rev |
| `verified` | latest `pass` entry is at the **current** `rev` |
| **`stale`** | latest `pass` entry is at a **lower** rev than current |

`stale` is the one that matters and it must be visible on the card. An agent must treat `stale`
as untested.

Simple tickets stay at `r1` forever. Tickets that grow accumulate revisions, and the Test Log
becomes the record of how the idea evolved. Both are correct.

---

## 5. Deferral is an idea pipeline, not a bin

Deferred work is an asset. The **reason** is the signal, because patterns in reasons reveal
missing capability.

| `defer_reason` | Meaning |
|---|---|
| `complexity` | Not understood well enough yet. |
| `size` | Understood, too big for the current cycle. |
| `risk` | Could break something that works. |
| `value` | Cost/benefit not demonstrated. |
| `dependency` | Waiting on something external. |

The board's **Parked view groups deferred tickets by reason, not by date.** Five things parked for
`size` suggests a missing decomposition; five parked for `complexity` suggests a spike is needed.
That grouping is the whole point — deferred ideas get revisited to spawn better versions, so they
must stay legible rather than disappearing into a Done-adjacent column.

`hold: deferred` must move to `hold: (absent)` + `state: todo` before work starts. No working
directly from a deferred ticket.

---

## 6. Handoffs

**A handoff is a ticket whose `actor` changes.** That is the whole definition.

- `AI → Human` — awaiting review, approval or a decision.
- `Human → AI` — unblocked, ready to pick up, with `tools` attached.

### Two granularities
1. **Per-ticket** — one card needs a human. Surfaced as a card treatment plus a header count.
2. **Batch gate** — the standup case. A set of tickets in `review` clears together, and the human
   then releases the next batch of AI work. This is derived, not a stored field: the Control Panel
   groups pending approvals and offers approve-and-release as one action.

Nothing advances past `review` without an explicit human action. No auto-commit, ever.

---

## 7. The decision gate

`DECISIONS.md` records only decisions with an `impact` of `timeline`, `scope`, `risk` or
`commercial`.

**If you cannot pick one of those four, it is not a decision — it is a note on the ticket.**

That single constraint is the difference between a log that protects the project and a log nobody
reads. See `DECISIONS.md` for the entry format.

---

## 8. Three-tier context

Load the cheapest tier that answers the question. This mirrors ADL's library tiers deliberately,
so the two projects can eventually join without a rewrite.

| Tier | Source | Cost | When |
|---|---|---|---|
| 1 — the working set | `TASKS.md` | the whole active backlog in one read | Always. Finding work, checking status. |
| 2 — the record | `TASKS-DONE.md` | only when you need history | "Has this been done before?" |
| 3 — deep history | `git log`, `reports/` | unbounded | Audit, "why did we decide that". |

At the scale this is built for — a few dozen active stories — tier 1 is one file and one read.
That is cheaper than an index plus a story file, and it cannot disagree with itself.

### Finding work
1. Read `TASKS.md`.
2. Pick `state: todo`, no `hold`, all `depends_on` done, highest priority, `stage` gate respected.
3. Read that one ticket file.
4. Set `state: doing`, `actor: AI`.
5. Work. Append to the Test Log. Bump `rev` if scope changed.
6. Set `state: review`, `actor: Human`. Stop there.

### Index format
Generated. One row per active ticket:

```
| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Hold | Blocked-By |
```

---

## 9. File lifecycle — keeping the folder readable at scale

The problem: at 100+ stories, most are `done` and none of them should cost anything to read.

### Where files live
| State | Location | Why |
|---|---|---|
| Active (`todo` / `doing` / `review`) | `tasks/` | Read constantly. |
| Parked (`hold: deferred`) | `tasks/` — **stays** | It is an idea pipeline (§5). Moving it out defeats the purpose. |
| Done, current increment | `tasks/` | Recent context is useful. |
| Done, older than one increment | `tasks/archive/` | Still in git, still greppable, no longer loaded. |

**Location is about permanence. The index is about attention.** Nothing is ever deleted — archiving
moves a file, and git keeps every version regardless.

### There is no index to keep in sync
There used to be. Splitting stories across files meant nothing could see the backlog at a glance,
so a generated `INDEX.md` was added — and then needed a generation date, a story count and a
staleness rule, all to stop a derived file from lying about the real one.

`TASKS.md` removes the whole problem. It is not a summary of the backlog; it **is** the backlog.

The header states how much active, blocked and parked work there is. That is a convenience, not
a source of truth — if it disagrees with the blocks below, the blocks win, and saving in the
board rewrites it.

*(The split layout still generates its index when saved, for projects already using it.)*
