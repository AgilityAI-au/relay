# Completed — SAP S/4HANA Programme

6 finished stories. Kept for the record; nothing here needs reading
to do today's work.

Active work is in TASKS.md.

---
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
- r1 · 2026-06-18 · pass · review · Human · workshop closed, delta list captured

---
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
- r1 · 2026-06-24 · pass · review · Human · reviewed against workshop notes

---
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
- r1 · 2026-07-08 · pass · review · Human · accepted by solution architect

---
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
- r1 · 2026-07-15 · pass · review · Human · 34 interfaces catalogued

---
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
- r1 · 2026-07-22 · pass · review · Human · reviewed with security lead

---
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
- r1 · 2026-06-30 · pass · review · Human · minuted at steering committee
