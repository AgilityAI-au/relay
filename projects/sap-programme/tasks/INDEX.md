# Task Index — SAP S/4HANA Programme

Tier 1 (AGENTS.md). **Generated — never hand-edit.** Regenerate after changing any
story file; the story files are the source of truth, this is a cache.

Stories: 16  ·  Active: 7  ·  Parked: 3  ·  Done: 6

---

## Active

Everything not done and not parked. **Read this section only, unless you have a reason.**

| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Blocked-By |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-003 | Sign off the fit-gap delta list | Fit-to-Standard | plan | review | Human | P0 | 17.0 | PI-1 | r2 | stale r1 | T-002 |
| T-005 | Configure company codes and chart of accounts | Finance Configuration | build | doing | Human | P0 | 5.2 | PI-2 | r1 | untested | T-004 |
| T-006 | Draft data migration mapping — customer master | Master Data | build | todo | AI | P1 | 3.8 | PI-2 | r1 | untested | T-003 |
| T-007 | Cleanse legacy vendor master | Master Data | build | doing | Human | P0 | - | PI-2 | r1 | untested | - |
| T-010 | Prepare SIT test scripts — Record to Report | Testing | build | todo | Human | P1 | - | PI-2 | r1 | untested | T-005 |
| T-011 | Generate UAT scenarios from the fit-gap list | Testing | build | todo | AI | P1 | 7.0 | PI-2 | r1 | untested | T-003 |
| T-013 | Validate migrated customer master sample | Master Data | build | review | Human | P0 | - | PI-2 | r1 | verified | T-006 |

**Ready now** (todo, unblocked, no hold): none

---

## Parked

Deferred work, grouped by reason. Read when planning, not when working.

| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Blocked-By |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-009 | Draft integration spec — electronic bank statement | Integrations | build | todo | AI | P2 | - | PI-2 | r1 | untested | T-008 |
| T-014 | Draft cutover plan and rehearsal schedule | Cutover | plan | todo | Human | P2 | - | PI-3 | r1 | untested | - |
| T-015 | Automated data quality dashboard | Master Data | build | todo | AI | P2 | - | PI-3 | r1 | untested | - |

---

## Recently done

| ID | Title | Feature | Stage | State | Actor | Pri | WSJF | PI | Rev | Test | Blocked-By |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | Run Fit-to-Standard workshop — Record to Report | Fit-to-Standard | plan | done | Human | P0 | - | PI-1 | r1 | verified | - |
| T-002 | Summarise workshop outcomes into a fit-gap delta list | Fit-to-Standard | plan | done | AI | P0 | - | PI-1 | r1 | verified | T-001 |
| T-004 | Draft configuration rationale — company code structure | Finance Configuration | build | done | AI | P1 | - | PI-1 | r1 | verified | - |
| T-008 | Catalogue interfaces in the legacy landscape | Integrations | plan | done | AI | P1 | - | PI-1 | r1 | verified | - |
| T-012 | Document the authorisation role matrix | Finance Configuration | build | done | AI | P1 | - | PI-1 | r1 | verified | - |
| T-016 | Confirm scope boundary — no custom code in Finance for phase 1 | Fit-to-Standard | plan | done | Human | P0 | - | PI-1 | r1 | verified | - |
