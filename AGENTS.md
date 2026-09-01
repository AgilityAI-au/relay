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
CLAUDE.md          how to work on the repo
README.md          what this is
DESIGN.md          UI/UX spec
DATA-MODEL.md      entities and fields
DECISIONS.md       the decision log
tasks/
  INDEX.md         generated — never hand-edit
  T-001.md         one ticket per file
  archive/         done, aged out
reports/           generated status reports
demo/              small sample backlog for the showcase
archive/
  versions/        superseded builds
  governance/      parked experiments
```

Only `tasks/*.md` and `DECISIONS.md` are authored. `INDEX.md` and `reports/` are **generated and
disposable** — regenerate rather than merge them.

---

## 2. Vocabulary — SAFe / JIRA / Azure DevOps

The board uses the words a scrum master or RTE already knows. Nothing here is invented.

| Term | What it is here | Authored? |
|---|---|---|
| **Epic** | Portfolio-level initiative. The `epic` label. | Label only — no epic record to maintain |
| **Feature** | ART-level grouping. The `feature` label. | Label only |
| **Story** | A ticket with no `parent`. The unit of work. | Yes — one file per story |
| **Task** | A ticket **with** a `parent`. Breakdown of a story. | Yes — same file format |
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
| 1 — skeleton | `tasks/INDEX.md` | ~30 tokens/ticket | Always. Finding work, checking status. |
| 2 — detail | `tasks/T-###.md` | ~300–500 tokens | Only tickets actually being worked. |
| 3 — history | `git log`, `reports/`, `tasks/archive/` | unbounded | Audit, review, "why did we do that". |

Do not read all of `tasks/` to find work. Read the index.

### Finding work
1. Read `tasks/INDEX.md`.
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

### The index is generated, never authored
This is the rule that stops the "two places to maintain" problem being real.

- Data flows **one way**: story files → `INDEX.md`. Never the reverse.
- **An agent must never write `INDEX.md`.** Edit the story file; regenerate the index.
- **The board rewrites it on every save.** An agent editing files directly must regenerate
  it, or open and save the folder in the board.
- The index header carries the generation date and story count, so drift is **detectable rather
  than silent**. If the count disagrees with the folder, regenerate before trusting it.

An index that can be rebuilt from source in one step is a **cache**, not a second source of truth.
Duplication is only dangerous when it cannot be regenerated.

### Index sections, and what an agent reads
`INDEX.md` carries three sections. **Read the first one only, unless you have a reason:**

1. **Active** — everything not done and not parked. The working set.
2. **Parked** — deferred work grouped by reason (§5). Read when planning, not when working.
3. **Recently done** — the last handful, for continuity. Older completions are a count and a
   pointer to `tasks/archive/`.

At 100 stories with 15 active, an agent loads roughly 500 tokens to find work rather than 40,000.
