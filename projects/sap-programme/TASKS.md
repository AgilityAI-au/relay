# Tasks — SAP S/4HANA Programme

**7 active** · 1 blocked · 2 parked. Completed work is in TASKS-DONE.md.

Each block below is one story. Edit them here by hand, or open this folder in
the board. How work moves between states is in AGENTS.md.

---
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
The r1 signature predates it — hence the stale marker. Re-sign before Realize.

---
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
3. Config rationale document updated with anything that changed in the build

---
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
2. Unmapped legacy fields listed with a keep-or-drop recommendation

---
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
can approve a merge.

---
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
Blocked: the bank has not confirmed which statement format they will send.

---
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
2. Expected results stated before execution

---
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
2. Each scenario names the business role who will run it

---
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
- r1 · 2026-08-25 · pass · manual · Human · sample reconciled, 3 defects raised

---
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
would be rebuilt.

---
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
reconciliation in T-013 covers the immediate need.
