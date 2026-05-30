# PRD Template (Core Universal + Type-Specific Extensions)

> Purpose: Avoid writing all requirements as "page interaction specs."
> Rules: Output the core universal template first, then append extension sections based on requirement type.

---

## Part I. Core Universal Template (Required for All Requirements)

```markdown
# PRD: [Requirement Name]

> Date: [YYYY-MM-DD]
> Status: [Draft (Pending Confirmation) / Confirmed]
> Requirement Type: [system_page / rule_policy / process_optimization / mixed]
> Maturity: [🔴 Sprout / 🟡 Growing / 🟢 Mature / ✅ Ready] (T=[x]/10)
> [If capped: Capped: reason — e.g. "E=0, need direct user evidence"]
```

---

## 1. Background and Goals

### 1.1 Background
- Why now
- Business trigger event
- Key evidence (data / interviews / real cases)

### 1.2 Goals
- Business goal
- User goal
- Success metrics (current -> target)

---

## 2. Problem Definition

### 2.1 Current State
[How it works now, where the main problems are]

### 2.2 Core Pain Points
| Role | Pain Point | Impact | Evidence |
|------|-----------|--------|----------|
| [Role] | [Description] | [Impact] | [Source] |

### 2.3 Desired State
[Ideal outcome]

---

## 3. Users and Stakeholders

### 3.1 Primary Users
| Role | Core Task | Usage Frequency | Success Criteria |
|------|-----------|-----------------|------------------|
| [Role] | [Task] | [Frequency] | [Criteria] |

### 3.2 Stakeholders
| Role | Concern | Decision Authority |
|------|---------|-------------------|
| [Role] | [Concern] | [Yes/No] |

---

## 4. Scope Definition

### 4.1 In Scope (Required This Phase)
- [Item]
- [Item]

### 4.2 Out of Scope (Explicitly Excluded)
- [Item]
- [Item]
- [Item]

---

## 5. Requirement Details

| ID | Requirement | Priority | Description | Source (Goal/Scenario/Constraint) |
|----|-------------|----------|-------------|-----------------------------------|
| RQ-1 | [Requirement] | P0/P1/P2 | [Description] | [Source] |

---

## 6. Constraints and Dependencies

### 6.1 Constraints
- Compliance constraints:
- Technical constraints:
- Resource/time constraints:

### 6.2 Dependencies
| Dependency | Type (System/Team/Data) | Risk |
|------------|-------------------------|------|
| [Dependency] | [Type] | [High/Medium/Low] |

---

## 7. Acceptance Criteria

### 7.1 Functional Acceptance
| Acceptance Item | Method | Pass Criteria |
|-----------------|--------|---------------|
| [AC-1] | [Method] | [Criteria] |

### 7.2 Business Acceptance
| Metric | Observation Window | Target |
|--------|--------------------| -------|
| [Metric] | [Period] | [Target] |

---

## 8. Risks and Open Issues

### 8.1 Key Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [Impact] | [Plan] |

### 8.2 Open Issues (Categorized)

#### Blockers (Must resolve before development)
| # | Issue | Owner | Deadline | Current Status |
|---|-------|-------|----------|----------------|
| O-1 | [Issue description] | [Who] | [When] | Pending/In Discussion/Confirmed |

#### Non-Blockers (Can proceed in parallel)
| # | Issue | Impact Scope | Suggested Timing |
|---|-------|-------------|------------------|
| O-2 | [Issue description] | [What's affected] | [Phase 1/Phase 2/Decide during implementation] |

---

## 9. Decision Record

### 9.1 Standard Decisions

| # | Decision Point | Conclusion | Reason | Source Round |
|---|---------------|------------|--------|--------------|
| 1 | [Decision] | [Conclusion] | [Reason] | [Round N] |

### 9.2 Conflict Decisions (with Trade-off Matrix)

> Use this template to record conflict resolution when contradictory requirements are discovered during follow-up.

```markdown
### Conflict #[Number]: [Conflict Summary]

**Conflict Background**: [One sentence describing the contradiction between two directions]

**Option Comparison**:

| Dimension | Option A: [Description] | Option B: [Description] |
|-----------|------------------------|------------------------|
| Impact | [Impact on users/business] | [Impact on users/business] |
| Complexity | [Implementation difficulty] | [Implementation difficulty] |
| Risk | [Potential issues] | [Potential issues] |
| Time | [Delivery timeline] | [Delivery timeline] |

**Final Decision**: [Choose A/B/Compromise]
**Decision Rationale**: [Specific rationale, citing data or ratios]
**Source**: [Round N follow-up / User confirmation]
**Dissenting Opinions**: [If any, record who objected and why]
```

---

## 10. Facts / Assumptions / Pending Confirmation

### 10.1 Confirmed Facts
- [Fact]

### 10.2 Working Assumptions
- [Assumption]

### 10.3 Pending Confirmation
- [Item to confirm]
```

---

## Part II. Extension Pack A: System/Page Type (system_page)

```markdown
## A1. Main Flow and Exception Flow

### Main Flow
1. ...
2. ...

### Exception Flow
| Scenario | Trigger Condition | Handling Strategy |
|----------|-------------------|-------------------|
| [Scenario] | [Condition] | [Strategy] |

## A2. Permissions and Role Actions
| Role | Visible | Actions | Restrictions |
|------|---------|---------|-------------|
| [Role] | [Scope] | [Actions] | [Restrictions] |

## A3. Data Entities and State Transitions
| Entity | Key Fields | States |
|--------|-----------|--------|
| [Entity] | [Fields] | [State Flow] |
```

---

## Part III. Extension Pack B: Rule/Policy Type (rule_policy)

```markdown
## B1. Rule Expressions and Priority
| Rule ID | Trigger Condition | Action | Priority |
|---------|-------------------|--------|----------|
| [Rule-1] | [Condition] | [Action] | [High/Medium/Low] |

## B2. Exceptions and Exemptions
| Scenario | Exception Handling | Approval Requirement |
|----------|--------------------| --------------------|
| [Scenario] | [Strategy] | [Requirement] |

## B3. Gradual Rollout and Rollback
- Rollout target:
- Rollout cadence:
- Rollback condition:
```

---

## Part IV. Extension Pack C: Process Optimization Type (process_optimization)

```markdown
## C1. As-Is (Current Process)
| Step | Owner | Duration | Pain Point |
|------|-------|----------|------------|
| [Step] | [Role] | [Time] | [Pain Point] |

## C2. To-Be (Target Process)
| Step | Owner | Target Duration | Change Point |
|------|-------|-----------------|--------------|
| [Step] | [Role] | [Time] | [Change Point] |

## C3. Migration Plan
- Pilot scope:
- Training plan:
- Cutover plan:
```

---

## Part V. Solution Specification

Always output. Content derived from Step 0-3 results. Sections that do not apply to the requirement type should be explicitly marked "不适用" with a one-line reason.

```markdown
## 11. Page/Module Breakdown

Information architecture tree showing the concrete pages or modules this requirement decomposes into.

```
[Requirement Name]
├── [Page/Module 1] — [One-line goal]
├── [Page/Module 2] — [One-line goal]
└── [Page/Module 3] — [One-line goal]
```

| Page/Module | Page ID | Primary User | Priority | One-line Goal |
|-------------|---------|-------------|----------|---------------|
| [Name] | [kebab-case] | [Role] | P0/P1/P2 | [Goal] |

## 12. Core Fields

Key data fields per page/module. Only list fields that are directly traceable to confirmed requirements or assumptions (mark with `[推断]` if confidence < 0.8).

| Page/Module | Field Name | Field ID | Type | Required | Validation Rule | Source |
|-------------|-----------|----------|------|----------|-----------------|--------|
| [Module] | [Name] | [snake_case] | text/select/date/number/enum | Y/N | [Rule] | [RQ-x / Round N] |

## 13. State Machine

States and allowed operations per core entity. If the requirement has no state transitions, write "不适用 — 本需求无状态流转".

### Entity: [Entity Name]

| State | Label | Description | Allowed Operations | Transition To |
|-------|-------|-------------|-------------------|---------------|
| [state_value] | [Display Label] | [When/why this state] | [Action 1, Action 2] | [Next State] |

## 14. Key Interactions

Core user interactions per page/module. Focus on non-trivial flows (skip simple CRUD). If the requirement is purely rule/policy with no UI interactions, write "不适用 — 本需求无交互界面".

| # | Trigger | Carrier | Content | UI Feedback |
|---|---------|---------|---------|-------------|
| I1 | [User action] | [modal/drawer/page/toast/notification] | [What user sees/does] | [Result + message] |

## 15. Data Examples

Mock data rows for each page's main table/list. Use realistic values. If the requirement has no list/table display, write "不适用 — 本需求无列表展示".

### [Page/Module Name]

| [Field 1] | [Field 2] | [Field 3] | [Status] | [Time] |
|-----------|-----------|-----------|----------|--------|
| [Realistic value] | [Realistic value] | [Realistic value] | [Status] | [Date] |
| [Realistic value] | [Realistic value] | [Realistic value] | [Status] | [Date] |
```

---

## Part VI. Quality Gate (Self-Check Before Output)

1. Core universal sections 1-10 must be complete
2. `Out of Scope` must have at least 3 items
3. Acceptance criteria must be testable
4. Unconfirmed information must be marked `[Pending Confirmation]`
5. Extension packs are selected by type, not all are required
6. Open issues must be categorized (blocker/non-blocker); blockers must have an owner and deadline
7. If conflict decisions exist, the trade-off matrix (impact/complexity/risk/time) must be filled in
8. When `C=0` or `E=0`, output status must be `Draft (Pending Confirmation)`
9. Solution Specification (sections 11-15) must always be output; sections that do not apply must be explicitly marked "不适用"
10. Every field in section 12 must trace back to a requirement ID (RQ-x) or follow-up round (Round N)
11. State transitions in section 13 must cover all states mentioned in requirement details
12. Data examples in section 15 must use realistic values, not placeholders
