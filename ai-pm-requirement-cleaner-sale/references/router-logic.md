# Router Logic (Single Source of Truth)

> This file unifies Step 1 routing rules to prevent inconsistencies across multiple documents.

---

## 1. Input Signals

Routing inputs:
1. Five-dimensional scores: `G/S/C/R/E` (0-2)
2. Total score: `T = G+S+C+R+E`
3. Conflict flag: `has_conflict`
4. Mode: `auto | fast_track | conservative | workshop | direct`
5. Requirement type: `system_page | rule_policy | process_optimization | mixed`

---

## 2. Score Definitions (with Anchor Examples)

| Dimension | 0 | 1 | 2 |
|------|---|---|---|
| G Goal | Unclear what to do | Has direction | Has clear goal and outcome |
| S Scenario | No scenario | Incomplete scenario | User, trigger, and flow are complete |
| C Constraint | No rule boundaries | Has some boundaries | Rules, permissions, and exceptions are clear |
| R Resolution | Only pain points | Has direction but no details | Key capabilities and behaviors are clear |
| E Evidence | Purely subjective | Indirect evidence | Direct evidence (data/real events) |

### Anchor Examples

#### G — Goal Clarity

| Score | Criteria | Anchor Example |
|------|---------|---------|
| 0 | Cannot determine what to do | "I want to make a nice-looking admin page" |
| 1 | Knows the general direction but lacks specific goals | "We need to do equipment management" (Manage what? How? Unclear) |
| 2 | Clear "what + why + what success looks like" | "We need equipment maintenance work order management to solve slow repair response, targeting average response time reduction from 4h to 1h" |

#### S — Scenario Sufficiency

| Score | Criteria | Anchor Example |
|------|---------|---------|
| 0 | No usage scenario description at all | Only a feature list, no "who uses it when" |
| 1 | Has scenario but lacks key details | "Maintenance workers use it" (When? Under what circumstances? Incomplete) |
| 2 | Specific user role + trigger condition + operation flow | "Maintenance worker receives a fault alarm, scans a QR code on-site with their phone to view historical repair records, and submits a maintenance work order" |

#### C — Constraint Awareness

| Score | Criteria | Anchor Example |
|------|---------|---------|
| 0 | No boundaries, rules, or exception descriptions | "Just basic CRUD" |
| 1 | Has some rules but incomplete | "There's permission control" (Who has what permissions? Unclear) |
| 2 | Clear boundaries + business rules + exception handling + permissions | "Operators can only view equipment in their own area, supervisors can approve work orders, and approvals auto-escalate on timeout" |

#### R — Resolution Clarity

| Score | Criteria | Anchor Example |
|------|---------|---------|
| 0 | Pure pain point description with no solution | "Maintenance is too slow right now" |
| 1 | Has direction but no specific solution | "We need a work order system" (What fields? What flow? Unclear) |
| 2 | Specific feature description and interaction patterns | "Work orders include equipment ID, fault description, priority, image attachments, and support a 4-status flow: assign -> accept -> repair -> acceptance" |

#### E — Evidence Credibility

| Score | Criteria | Anchor Example |
|------|---------|---------|
| 0 | Purely subjective judgment or gut feeling | "I think we need it" |
| 1 | Indirect evidence (competitors have it, industry convention, leadership request) | "All our competitors have this feature" |
| 2 | Direct evidence (user feedback, data-backed, actual pain points) | "30% of customer complaints last month were about slow maintenance response" |

---

## 3. Requirement Type Classification

### 3.1 system_page (System/Page Type)

Characteristics:
- High-frequency keywords: page, list, form, approval, permissions, status, data flow
- Output leans toward functionality and interaction

### 3.2 rule_policy (Rule/Policy Type)

Characteristics:
- High-frequency keywords: rule, policy, threshold, billing, commission, subsidy, risk control, trigger condition
- Output leans toward rule expressions and exception handling

### 3.3 process_optimization (Process Optimization Type)

Characteristics:
- High-frequency keywords: process redesign, cross-department collaboration, roles and responsibilities, SOP, handoff, efficiency improvement
- Output leans toward As-Is/To-Be and migration plans

---

## 4. Main Routing Rules (Priority Top to Bottom)

```text
R0. if mode == direct:
      -> direct_draft (direct draft, skip follow-up)

R1. if has_conflict == true:
      -> first_principles (deconstruct conflict first)

R2. if T >= 8 and min(G,S,C,R,E) >= 1 and has_conflict == false:
      -> quick_structured (fast structuring)

R3. if G == 0:
      -> jtbd

R4. if S == 0:
      -> discovery

R5. if C == 0 and R >= 1:
      -> prd_game

R6. if E == 0:
      -> discovery_evidence (evidence gap-filling)

R7. else:
      -> prd_game (default convergence path)
```

### R0-R7 and Execution Mode Mapping

| Route | auto | fast_track | conservative | workshop | direct |
|------|------|-----------|-------------|----------|--------|
| R0 direct_draft | — | — | — | — | **Execute** |
| R1 first_principles | Execute | Skip, go to direct draft | Execute | Step-by-step confirm | — |
| R2 quick_structured | Execute | Execute | Execute | Step-by-step confirm | Execute |
| R3-R7 Normal Path | Execute | At most 1 round | Conservative inference | Step-by-step confirm | — |

**Notes**:
- `direct` mode only goes through R0 or R2, does not enter follow-up
- `fast_track` follows normal routing but with at most 1 round of follow-up, no Deep layer
- `workshop` follows normal routing but pauses for confirmation at each step, loads all Deep layers
- `conservative` follows normal routing but does not auto-fill high-risk information, retains `[Pending Confirmation]`

---

## 5. Hard Thresholds (Preventing "High Scores from Masking Gaps")

1. When `C=0` or `E=0`, outputting a "Confirmed PRD" directly is prohibited.
A "Draft (Pending Confirmation)" may be output, with blocking items listed under open issues.

2. "High-score fast structuring" must satisfy:
- `T>=8`
- Each of `G/S/C/R/E` must be `>=1`
- `has_conflict=false`

3. Conflicts always take priority:
- Even if `T` is very high, if there are conflicts, go through First Principles first.

---

## 6. Follow-Up Rounds and Stopping Conditions

### 6.1 Rounds

| Mode | Max Rounds | P0 per Round | P1 per Round | Deep Layer |
|------|----------|---------|---------|---------|
| auto | 3 | 1-3 | 0-2 | Per trigger rules |
| conservative | 3 | 1-3 | 0-2 | Per trigger rules |
| workshop | 3 | 1-3 | 0-2 | All loaded |
| fast_track | 1 | 1-2 | 0 | Not loaded |
| direct | 0 | 0 | 0 | Not loaded |

### 6.2 Stopping Conditions

Convergence is allowed when any one condition is met:
1. All of `G/S/C/R/E` are `>=1`
2. No new P0 gaps for 1 consecutive round
3. Maximum rounds reached
4. User requests to wrap up

---

## 7. Dynamic Switching Rules

| Current Perspective | Trigger Condition | Next Perspective |
|---------|---------|---------|
| jtbd | G>=1 | discovery |
| discovery | S>=1 and C==0 | prd_game |
| discovery | Conflict discovered | first_principles |
| prd_game | C filled and critical assumption conflict discovered | first_principles |
| first_principles | Conflict deconstructed | Return to the perspective with the largest gap (G/S/C/E) |

---

## 8. Post-Convergence Output Status

1. User explicitly "confirms" -> `PRD Confirmed Version`
2. Not explicitly confirmed or no response -> `PRD Draft (Pending Confirmation)`

`auto` mode allows the second case by default to avoid getting stuck at the confirmation step.

---

## 9. Deep Layer Trigger Rules

Deep layer questions are loaded on demand, without adding to the default round burden.

### Trigger Conditions

| Trigger Condition | Loaded Content | Trigger Timing |
|---------|---------|---------|
| JTBD path and responses are feature-oriented (no social/emotional signals) | Deep A: Social/emotional dimensions | Evaluated after Round 1 |
| PRD Game path and C filled but still missing competitive/priority info | Deep C: Competitive benchmarking + priority trade-off | Evaluated after Round 2 |
| First Principles path and needs rebuilding after conflict deconstruction | Deep D: Rebuild validation | Evaluated after conflict deconstruction |
| `workshop` mode | All Deep layers | From Round 1 onwards |
| User actively requests "deeper" | Current path's Deep layer | Any round |

### Cases Where Deep Layer Is Not Triggered

- `fast_track` mode: No Deep layers loaded
- `direct` mode: No Deep layers loaded
- Maximum rounds reached: Even if trigger conditions are met, no more loading

---

## 10. Domain Follow-Up Injection

After loading a domain pack, domain-specific questions automatically enter the P1 candidate pool:

1. Domain questions do not consume the Core layer's P0/P1 budget
2. Each round can supplement 0-1 domain P1 questions from the domain candidate pool
3. Domain questions are only available when the corresponding domain is detected
4. Domain questions do not trigger Deep layer loading — they are an independent injection channel

---

## 11. First-Round Cross-Perspective Rules

Routing determines the primary perspective, but the first round of follow-up allows cross-perspective combinations:

1. First-round goal: Prioritize filling weaknesses in G and S (dimensions scoring < 2)
2. At most 1 P0 question can be drawn from a non-primary perspective in the first round
3. From Round 2 onwards, focus on the primary perspective
4. Dynamic switching rules (Section 7) are not affected by this rule — new gaps discovered in any round can trigger a switch

---

## 12. Handling "I Don't Know"

When a user responds "I don't know," handle it in the following order:

1. **Simplify the question**: Give 2-3 common options for the user to choose from
2. **Reverse Question**: Ask from the opposite angle — "What's the least likely scenario?"
3. **Mark**: If still unclear, mark as `[Pending Confirmation]` and record under open issues

Under `conservative` mode, skip steps 1-2 and directly mark as `[Pending Confirmation]`.

### 12.1 Consecutive "I Don't Know" Detection

Track the count of consecutive P0 questions answered with "I don't know" (or equivalent: "not sure," "haven't thought about it," skipping without substantive input).

| Consecutive Count | Action |
|-------------------|--------|
| 1 | Normal handling: simplify → reverse → mark |
| 2 | Activate **Probe Mode**: switch remaining P0 questions to ultra-concrete, scenario-based framing (see examples below) |
| 3 | Activate **Early Pivot**: pause follow-up, output a Requirement Exploration Brief instead of continuing the PRD flow (see below) |

#### Probe Mode (Consecutive = 2)

When Probe Mode activates, reframe the current round's remaining P0 questions using "last time" or "specific scenario" framing instead of abstract concepts:

| Abstract Question (Normal Mode) | Probed Question (Probe Mode) |
|---------------------------------|------------------------------|
| What are the success criteria? | Last month, what number made you say "this isn't good enough"? |
| Who are the target users? | When you picture someone using this, who comes to mind first? |
| What constraints exist? | If this goes live and something goes wrong, what would go wrong? |
| What is out of scope? | If you could only pick 2 features, which 2 would you keep? |

Do NOT change question intent — only change framing to be more concrete and personal.

#### Early Pivot (Consecutive = 3)

When 3 consecutive P0 questions get "I don't know," the requirement is not ready for PRD structuring. Immediately halt follow-up and output:

```markdown
## Requirement Exploration Brief (Not Ready for PRD)

### Status: 🔴 Needs Exploration First

You've indicated uncertainty on several critical questions. This is completely normal
at the early stage — but it means we should gather more information before
structuring a PRD. Continuing now would produce a document full of unverified
assumptions.

### Recommended Next Steps (pick 1-2 that fit your situation)

| # | Action | Why | Time Estimate |
|---|--------|-----|---------------|
| 1 | **Talk to 3 real users** — ask them "last time you had this problem, what happened?" | Validates whether the problem is real and how people actually behave | 1-2 hours |
| 2 | **Write a 1-page problem statement** — "Who has what problem, when, and what happens?" | Forces you to articulate the core before jumping to solutions | 30 min |
| 3 | **Check competitor or analog products** — how do they solve this? | Provides calibration baseline and sparks concrete thinking | 1 hour |
| 4 | **Collect existing data** — error logs, complaint records, support tickets | Converts "I think" into "we measured" | Varies |
| 5 | **Run a 15-min team brainstorm** — write sticky notes, then vote on top 3 | Surfaces distributed knowledge that no single person holds | 30 min |

### Questions to Answer Before Returning

Come back with answers to these, and we can pick up where we left off:

1. [First unanswered P0 — reframed in concrete terms]
2. [Second unanswered P0 — reframed in concrete terms]

### Current Score Snapshot

G=[x] S=[x] C=[x] R=[x] E=[x] | T=[x]/10 | Maturity: 🔴 Sprout
```

**Rules for Early Pivot**:
- Always include the score snapshot and maturity rating
- List exactly the unanswered P0 questions (max 3) in concrete framing
- Recommendations must include at least one "talk to users" option
- The output is **not a PRD** — it is an exploration brief
- After exploration, the user can restart the skill with their updated requirement

---

## 13. Requirement Maturity Rating

After Step 0 diagnosis and after the final PRD output, display a maturity rating badge.

### 13.1 Rating Scale

| Total Score T | Maturity Level | Badge | Meaning |
|---------------|---------------|-------|---------|
| 1-3 | Sprout | 🔴 Sprout | Requirement is an idea, not yet validated. Recommend exploration before PRD. |
| 4-6 | Growing | 🟡 Growing | Has direction but lacks evidence or constraints. PRD output will be Draft. |
| 7-8 | Mature | 🟢 Mature | Ready for development review. May still have minor gaps. |
| 9-10 | Ready | ✅ Ready | Fully structured, can proceed to development or prototype. |

### 13.2 Display Rules

1. **After Step 0 Diagnosis**: Always display the maturity badge alongside the 5-dimension scores.
   Format: `Maturity: 🔴 Sprout (T=3/10)`

2. **After Final Output**: Display the badge in the PRD header.
   Format: `> Maturity: 🟢 Mature (T=8/10) — Suitable for development review`

3. **Dynamic Update**: If follow-up rounds improve the score, update the badge.
   Display the progression: `Maturity: 🔴 Sprout (T=3) → 🟡 Growing (T=6) → 🟢 Mature (T=8)`

4. **Hard Threshold Override**: Even if T ≥ 7, if C=0 or E=0, the maturity cannot exceed "Growing."
   Rationale: Missing constraints or evidence means the requirement is not truly ready.
   Format: `> Maturity: 🟡 Growing (T=8/10) — Capped: E=0, need user evidence`

5. **Conflict Override**: If unresolved conflicts exist, the maturity cannot exceed "Growing."
   Format: `> Maturity: 🟡 Growing (T=8/10) — Capped: 1 unresolved conflict`

### 13.3 Maturity-Specific Output Guidance

| Maturity | Output Behavior |
|----------|----------------|
| 🔴 Sprout | If consecutive "don't know" ≥ 3, trigger Early Pivot (Section 12.1). Otherwise, output PRD Draft with heavy `[Pending Confirmation]` and a prominent exploration recommendation at the top. |
| 🟡 Growing | Output PRD Draft (Pending Confirmation). Include a "Before Development" checklist of items to resolve. |
| 🟢 Mature | Output PRD Draft or Confirmed (based on user confirmation). Minor `[Pending Confirmation]` items are non-blocking. |
| ✅ Ready | Output PRD Confirmed Version. Proceed to prototype bridge if requested. |

### 13.4 PRD Header Integration

Add the maturity badge to the PRD template header:

```markdown
# PRD: [Requirement Name]

> Date: [YYYY-MM-DD]
> Status: [Draft (Pending Confirmation) / Confirmed]
> Requirement Type: [system_page / rule_policy / process_optimization / mixed]
> Maturity: [🔴 Sprout / 🟡 Growing / 🟢 Mature / ✅ Ready] (T=[x]/10)
> [If capped] Capped: [reason]
```

### 13.5 Maturity Progression Tracking

In the Requirement Cleaning Summary (first deliverable), include:

```markdown
### Maturity Progression

| Stage | Score | Maturity | Key Improvement |
|-------|-------|----------|-----------------|
| Initial Diagnosis | T=3 | 🔴 Sprout | — |
| After Round 1 | T=6 | 🟡 Growing | Added real evidence (incident + metric) |
| After Round 2 | T=8 | 🟢 Mature | Constraints and scope defined |
| Final | T=9 | 🟢 Mature | Remaining: 1 non-blocking item |
```

This gives stakeholders a visual sense of how the requirement evolved through the cleaning process.
