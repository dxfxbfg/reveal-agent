# Four-Step Cleaning Method (Methodology Overview)

> Core principle: Requirements are not "written" — they are "converged through asking the right questions."

---

## I. Methodology Framework

```
Raw Requirement
  -> Diagnose (Gap Identification)
  -> Follow-Up (Fill Critical Facts, Dual-Layer Question Bank)
  -> Converge (Make Trade-offs, Define Boundaries)
  -> Finalize (PRD Draft / Confirmed Version)
```

---

## II. Methodology Origins

This methodology integrates four proven product analysis frameworks. They are not simply stacked, but dynamically switched as "lenses" based on gap type.

### 1. JTBD (Jobs-to-be-Done)
- Origin: Clayton Christensen
- Core idea: Users "hire" a product to accomplish a "job," they are not "buying" features
- When to use: When the requirement only describes features but lacks goals

### 2. Discovery Interview
- Origin: Rob Fitzpatrick, *The Mom Test*
- Core idea: Ask about past facts, not hypothetical opinions
- When to use: When the requirement lacks real-world scenarios and evidence

### 3. PRD Development
- Origin: Marty Cagan / Martin Eriksson
- Core idea: Write clearly about success criteria, constraint boundaries, and scope trade-offs
- When to use: When the requirement lacks constraint definitions and acceptance criteria

### 4. First Principles
- Origin: Aristotle -> Elon Musk
- Core idea: Break down to fundamental facts, rebuild solutions from scratch
- When to use: When the requirement contains contradictions or conflicts

These four are not fixed sequential steps, but perspectives dynamically switched based on gaps.

---

## III. Key Design Rules

### Anti-Masking Rule
- Quick structuring is only allowed when `T>=8`, all of `G/S/C/R/E` are `>=1`, and there are no conflicts
- When `C=0` or `E=0`, outputting a "confirmed PRD" directly is prohibited

### Round Cadence
- Each round has `1-3` P0 items, with a maximum of `3` rounds
- `fast_track` allows at most `1` round

### Confirmation Mechanism
- When not explicitly confirmed, output "PRD Draft (Pending Confirmation)" — do not block the process

### Dual-Layer Question Bank
- Core layer is loaded by default (3 P0 + 2 P1 per path), lightweight for daily use
- Deep layer is loaded based on trigger rules (social/emotional, competitive/priority, rebuild validation), for on-demand deep dives

### Scoring Anchors
- Each dimension's 0/1/2 scores have anchor text to reduce scoring drift

### Conflict Trade-off
- Standardized four-dimensional comparison (Impact/Complexity/Risk/Time), recorded in decision log

### Open Issue Classification
- Blocking items (must be resolved before development) and non-blocking items (can proceed in parallel) are separated
- Blocking items must have an owner and a deadline

### Template Generalization
- PRD changed to "Core Universal + Extension Packs," selected by requirement type, no longer forced into page-based format

---

## IV. Requirement Types and Template Mapping

1. System/Page Type -> Core Template + Extension Pack A
2. Rule/Policy Type -> Core Template + Extension Pack B
3. Process Optimization Type -> Core Template + Extension Pack C
4. Mixed Type -> Core Template + Extension Packs as needed

---

## V. Deliverable Standards

Required:
1. Cleaning Summary
2. Key Follow-Up Records
3. Facts / Assumptions / Pending Confirmation
4. In-scope / Out-of-scope
5. Decision Log (including conflict trade-off matrix, if conflicts exist)
6. PRD (Draft or Confirmed)

Optional:
7. Prototype Bridging Appendix

---

## VI. Anti-Patterns (Strictly Avoid)

1. Skipping follow-up questions and directly "packaging into a final draft"
2. Filling high-risk fields with guesses
3. Writing all requirements as page interactions
4. Not writing out-of-scope
5. No decision trail
6. Continuing to push forward with unresolved conflicts
