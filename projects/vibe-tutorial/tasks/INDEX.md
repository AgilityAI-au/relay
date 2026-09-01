# Task Index — Vibe coding: a tutorial

Tier 1 (AGENTS.md). **Generated — never hand-edit.** Regenerate after changing any
story file; the story files are the source of truth, this is a cache.

Stories: 21  ·  Active: 12  ·  Parked: 3  ·  Done: 6

---

## Active

Everything not done and not parked. **Read this section only, unless you have a reason.**

| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Blocked-By |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-005 | Use it for ten minutes and write down what is wrong | First Build | build | doing | Human | P1 | - | Session 1 | r1 | untested | T-004 |
| T-006 | Fix one thing at a time | First Build | build | review | Human | P0 | 8.7 | Session 2 | r3 | stale r2 | T-005 |
| T-009 | Read the change, not just the result | Habits That Save You | build | todo | Human | P1 | - | Session 2 | r1 | untested | - |
| T-010 | Write down what you tested | Habits That Save You | build | todo | AI | P1 | - | Session 2 | r1 | untested | - |
| T-011 | Ask the AI what it is unsure about | Habits That Save You | build | todo | Human | P2 | - | Session 2 | r1 | untested | - |
| T-012 | Decide what you are not building | Finishing | plan | todo | Human | P1 | - | Session 2 | r1 | untested | - |
| T-013 | Show it to one person | Finishing | build | todo | Human | P0 | 15.5 | Session 2 | r1 | untested | T-007 |
| T-014 | Set your next project up properly | Finishing | plan | todo | Human | P1 | - | Later | r1 | untested | T-013 |
| T-017 | Write AGENTS.md and CLAUDE.md | Write It Down | plan | doing | Both | P0 | - | Session 1 | r1 | untested | - |
| T-018 | Split anything big out of CLAUDE.md | Write It Down | plan | todo | Both | P1 | - | Session 2 | r1 | untested | T-017 |
| T-019 | Start a decision log | Write It Down | plan | todo | Both | P1 | - | Session 2 | r1 | untested | T-017 |
| T-020 | Check the files still describe reality | Write It Down | plan | todo | Both | P2 | - | Session 2 | r1 | untested | T-017 |

**Ready now** (todo, unblocked, no hold): T-009, T-010, T-011, T-012

---

## Parked

Deferred work, grouped by reason. Read when planning, not when working.

| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Blocked-By |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-007 | Add the one feature you actually wanted | First Build | build | todo | AI | P0 | 4.2 | Session 2 | r1 | untested | T-006 |
| T-015 | Add automated tests | Finishing | build | todo | AI | P2 | - | Later | r1 | untested | - |
| T-016 | Make it look good | Finishing | build | todo | AI | P2 | - | Later | r1 | untested | - |

---

## Recently done

| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Blocked-By |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | Pick something small you actually want | Set Up | plan | done | Human | P0 | - | Session 1 | r1 | verified | - |
| T-002 | Choose your AI tool and install it | Set Up | plan | done | Human | P0 | - | Session 1 | r1 | verified | - |
| T-003 | Make a folder and open it in both places | Set Up | plan | done | Human | P0 | - | Session 1 | r1 | untested | T-002 |
| T-004 | Ask for the smallest thing that runs | First Build | build | done | AI | P0 | - | Session 1 | r2 | verified | T-003 |
| T-004a | Write down how to start it | First Build | build | done | AI | P2 | - | Session 1 | r1 | verified | - |
| T-008 | Commit before you experiment | Habits That Save You | build | done | Human | P0 | - | Session 1 | r1 | verified | - |
