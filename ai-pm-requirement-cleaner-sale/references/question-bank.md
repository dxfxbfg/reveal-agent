# Question Bank (Core + Deep Dual Layer)

> Usage rules: In each round, draw `1-3` P0 questions from the corresponding Core layer path; supplement with `0-2` P1 questions. If P0 gaps remain after exhausting the Core layer, load the Deep layer.
> Do not ask all questions from a single path in one round.
> Deep layer loading rules are detailed in `router-logic.md`, Section 9.

---

# Core Layer (Default Loaded)

---

## A. JTBD (Unclear Goals)

### P0 Candidates

1. Whom does this requirement help, and what "job" does it help them accomplish? Please describe it starting with a verb.
Why ask: Converts "feature words" into "job goals."
   - **A.** Enable team leads to complete work dispatching within 5 minutes with trackable status
   - **B.** Enable finance to complete reconciliation review within 1 hour before month-end close
   - **C.** Enable sales to look up real order progress within 30 seconds during a customer call

2. If this is done well, what will the business outcome look like?
Why ask: Defines "success" outcomes, not "feature delivery."
   - **A.** Average response time reduced from 4h to 1h
   - **B.** Weekly manual consolidation time reduced by 60%
   - **C.** Customer complaint rate reduced by 30%

3. How do people currently manage without the system?
Why ask: Workarounds reveal real pain points and migration resistance.
   - **A.** Excel spreadsheets
   - **B.** WeChat groups + verbal communication
   - **C.** Paper forms

### P1 Candidates

1. Which category does this requirement fall into: "faster / simpler / newly possible"?
   - **A.** Faster: Currently repair-to-dispatch takes half a day, want to compress to 30 minutes
   - **B.** Simpler: Currently requires 5 steps, want to simplify to 1-click completion
   - **C.** Possible: This capability does not exist at all today
   - Or provide an open-ended answer

2. What is the worst consequence of not doing this requirement?

### Follow-up Techniques

- Five Whys: User says "I want a report" -> Why? -> "To see data" -> Why? -> "To report to the boss" -> Why? -> "Boss wants to control costs" -> Root cause emerges
- Distinguish "job" from "solution": User says "I want an AI recommendation system" -- that's not a job; the job is "help users discover content they're interested in"

### Pitfalls

- Do not accept vague answers like "improve efficiency" -- press for specific metrics
- Do not skip "why" and jump straight to "how"
- Do not treat "I want feature X" as a job description

---

## B. Discovery (Insufficient Scenarios)

### P0 Candidates

1. When was the last time you encountered this problem? What happened?
Why ask: Based on real behavior, avoids vague opinions.
   - **A.** Last Wednesday, production line was down for 40 minutes before the fault was located
   - **B.** Month-end reconciliation took 2 days
   - **C.** Yesterday a customer was chasing an order but internal information was inconsistent

2. What roles are involved in this process? Who initiates, who approves, who executes, who verifies?
Why ask: Clarifies the responsibility chain and permission boundaries.
   - **A.** Reporter -> Supervisor -> Maintenance Technician -> Verifier
   - **B.** Applicant -> Department Head -> Finance -> Cashier
   - **C.** Sales -> Planning -> Production -> Quality Inspection -> Shipping

3. What is the most common exception? How is it handled?
Why ask: Exception flows determine whether the requirement is implementable.
   - **A.** Network outage, submission fails
   - **B.** Two people concurrently editing the same record
   - **C.** Upstream system data delay or missing data

### P1 Candidates

1. Problem frequency (daily/weekly/monthly) and impact scale?
2. Who needs to see the results? Which metrics do they care about?

### Follow-up Techniques

- Only ask about things that actually happened, not hypotheticals
- Press for details: time, place, frequency, people involved
- "The last time" is more valuable than "usually"

### Pitfalls

- Do not ask "what do you think?" (subjective evaluation)
- Do not ask "would you use it?" (hypothetical answer)
- Do not ask "do you need feature X?" (leading question)

---

## C. PRD Solution Negotiation (Unclear Constraints)

### P0 Candidates

1. What are the success criteria? What are the current baseline and target values?
Why ask: Without target values, there is no way to validate acceptance.
   - **A.** Response time: 4h -> 1h
   - **B.** Inventory count duration: 3 days -> 0.5 days
   - **C.** Error rate: 10% -> 1%

2. What is explicitly "not in scope"?
Why ask: Controls scope creep.
   - **A.** No mobile app in this phase
   - **B.** No AI recommendations in this phase
   - **C.** No cross-tenant sharing in this phase

3. What are the key constraints (compliance/permissions/performance/integration)?
Why ask: Constraints define delivery boundaries.
   - **A.** Audit logs retained for 1 year
   - **B.** Pages usable within 3 seconds
   - **C.** Must bidirectionally sync with ERP

### P1 Candidates

1. If you can only launch with 3 capabilities, which 3 would you choose?
2. Which items can be deferred to phase 2?

### Follow-up Techniques

- Reject "just make it user-friendly" -- press for specific metrics
- Distinguish "must-have conditions" from "nice-to-have states"
- Asking "what's the minimum you'd accept" is more valuable than asking "what do you want"

### Pitfalls

- Do not accept all features as P0 -- that equals having no priorities
- Do not overlook exception scenarios (empty data, operation failure, concurrent conflicts)
- Do not ignore permissions (who can see what, who can do what)

---

## D. First Principles (Conflicts and Controversies)

### P0 Candidates

1. What are the implicit assumptions in the current approach? Which is most likely to be invalid?
Why ask: Identify high-risk premises early.
   - **A.** Assumes all devices can connect to the network
   - **B.** Assumes all roles are willing to add new data entry steps
   - **C.** Assumes data definitions are naturally consistent

2. What does each conflicting party want? What are their bottom lines?
Why ask: Locate the "non-negotiables."
   - **A.** Business wants flexible configuration, engineering wants fixed workflows
   - **B.** Management wants full visibility, frontline wants minimal data entry
   - **C.** Customer wants fast deployment, internal team wants full compliance

3. Present the trade-offs (impact/complexity/risk/time) of two approaches and choose one.
Why ask: Forces decision closure.
   - **A.** Fixed workflow first, faster to launch
   - **B.** Configurable first, broader coverage
   - **C.** Core fixed + partially configurable (compromise)

### P1 Candidates

1. Which issues can be solved without technical changes first?
2. If split into two phases, what is the minimum closed loop for phase 1?

### Follow-up Techniques

- List all implicit assumptions and verify each one
- Distinguish "facts" from "opinions"
- Ask "what if we reverse it?" -- think in reverse

### Pitfalls

- Do not settle on "let's discuss more" -- must provide a recommended approach
- Do not ignore "the cost of not doing this requirement"
- Do not assume all stakeholders share the same goals

---

## Universal Fallback (When Path Cannot Be Determined)

Ask in priority order:
1. Goals and success criteria
2. Users and scenarios
3. Main flow
4. Exception flow
5. Constraints and dependencies
6. Acceptance criteria

---

## Unified Follow-up Template

```markdown
## Round N Follow-up

**Current Understanding**: [1-2 sentences]

**P0 (Please prioritize answering)**
1. [Question] — *Why ask: [...]*
   > 💡 Reference answers:
   > - **A.** ...
   > - **B.** ...
   > - **C.** ...

2. [Question] — *Why ask: [...]*
3. [Question] — *Why ask: [...]*

**P1 (Optional)**
4. [Question]
5. [Question]

You can reply directly with: `1A 2C 3Yes`, or supplement freely.
```

---

# Deep Layer (Loaded On Demand)

---

## Deep A: JTBD Social/Emotional Dimensions

> **Trigger condition**: Load when on the JTBD path and responses are feature-oriented (no emotional/social signals).

### A-S1. Social/Perception Dimensions

**P0 Candidates**

1. After this is done, how will the user appear in others' eyes?
Why ask: Social drivers determine whether users will actively adopt the system.
   - **A.** During client visits, shop floor dashboards show real-time progress, looking very professional
   - **B.** When the boss reviews reports, data is real-time and accurate, no need to chase people
   - **C.** Frontline operators using the new system makes the company look digitally mature

2. If this is not done, will the user be embarrassed in front of others?
Why ask: Social pain points often have higher urgency than efficiency pain points.
   - **A.** Yes -- clients visit and we're still using paper forms, looks backward
   - **B.** Yes -- monthly business review data doesn't match, gets stumped by the boss
   - **C.** No -- mainly an internal efficiency issue, not externally visible

### A-S2. Emotional Dimensions

**P0 Candidates**

1. What is the user's strongest emotion when doing this task now?
Why ask: Emotion determines the user's willingness to adopt the system.
   - **A.** Anxiety -- month-end reconciliation never matches, don't know where the problem is
   - **B.** Frustration -- every production schedule change requires recalculating, manual calculation is error-prone
   - **C.** Boredom -- entering repetitive data every day, pure manual labor

2. Under what emotional state was this requirement raised?
Why ask: The emotional state at the time of raising reflects urgency and real motivation.
   - **A.** Crunch time -- delivery to client is next month, process still not working
   - **B.** Post-mortem -- several quality incidents last quarter, need to review and improve
   - **C.** Planning -- company is rolling out MES, planning which modules to do first

**P1 Candidates**

1. Did this requirement come from actual users, or from managers/decision-makers?
   - **A.** Actual users -- raised by the shop floor supervisor who gets headaches from daily progress chasing
   - **B.** Management -- mandated by the boss who wants data-driven operations by year-end
   - **C.** External -- required by the client during acceptance review, won't pass without it

### Follow-up Techniques

- Focus on "who would notice": if no one notices the change, social driving force is weak
- Distinguish users from buyers: the person requesting may not be the person using it
- Emotion is not surface-level emotion -- press with "when was the last time this made you completely break down"

### Pitfalls

- Do not treat social/emotional dimensions as "nice-to-have" -- they are often the core driver
- Do not assume everyone has the same emotions -- different roles may feel differently

---

## Deep C: Competitive Benchmarking + Priority Negotiation

> **Trigger condition**: Load when on the PRD negotiation path and after constraints are filled, competitive/priority information is still missing.

### C-Comp. Competitive Benchmarking

**P0 Candidates**

1. How do competitors handle this feature? Any references?
Why ask: Competitors serve as a calibration baseline for requirements and solutions.
   - **A.** Have a reference -- saw Company XX's MES, their work order flow is quite complete
   - **B.** Reviewed but not applicable -- too generic, doesn't fit our business
   - **C.** No reference -- designed primarily based on internal pain points

2. What do competitors do best? What do they do worst?
Why ask: Clarifies differentiation direction.
   - **A.** Best: real-time data collection and alerts; Worst: too complex, operators can't use it
   - **B.** Best: modern UI; Worst: doesn't align with actual business workflows
   - **C.** Best: good mobile experience; Worst: reporting is too weak

**P1 Candidates**

1. Do we want to match competitors, or do something different?
   - **A.** Match -- parity on core features, focus on fitting our own processes
   - **B.** Differentiate -- nail the mobile experience they failed at
   - **C.** Don't compare -- the goal is to solve our own problems

### C-Pri. Priority Negotiation

**P0 Candidates**

1. If you can only have 3 features, which 3 would you choose? Why?
Why ask: Forced ranking reveals true priorities.
   - **A.** Work order creation, approval routing, status tracking -- core chain
   - **B.** Permission management, data export, message notifications -- daily usage
   - **C.** Report analysis, mobile adaptation, automatic alerts -- nice-to-have

2. Which are "must-haves before go-live"? Which are "nice-to-haves"?
Why ask: Distinguishes MVP from enhancements.
   - **A.** Must-have -- work order submission, approval, status transitions
   - **B.** Nice-to-have -- SLA timeout alerts, maintenance reports, mobile
   - **C.** Not considered -- AI smart dispatch, predictive maintenance

**P1 Candidates**

1. If time is tight, what can be deferred to phase 2?
   - **A.** Equipment maintenance reports to phase 2, use Excel export as interim
   - **B.** Auto-dispatch to phase 2, manual dispatch in phase 1
   - **C.** Mobile to phase 2, PC-only in phase 1

### Follow-up Techniques

- Competitors aren't just direct competitors -- they can be "the user themselves" (manual/Excel/WeChat groups)
- Asking "what's the minimum you'd accept" is more valuable than asking "what do you want"
- Not everything can be P0 -- press with "if you could only keep one"

### Pitfalls

- Do not build something just because competitors have it -- validate against your own business scenarios
- Do not mark everything as P0 -- that equals having no priorities
- Do not ignore the "don't do it" option -- sometimes cutting features is the right decision

---

## Deep D: Rebuild Validation

> **Trigger condition**: Load when on the First Principles path and the solution needs rebuilding after conflict resolution.

### D-Rec. Rebuild Validation

**P0 Candidates**

1. If we designed from scratch, ignoring the current system, what would the optimal approach be?
Why ask: Break free from existing inertia to find the ideal solution.
   - **A.** All equipment IoT-enabled, automatic collection, automatic dispatch, automatic closure
   - **B.** Unified digital platform, all systems integrated, one dataset shared company-wide
   - **C.** Full coverage across APP + mini-program + Web, process from anywhere anytime

2. Where does the current approach fall short of the optimal? By how much?
Why ask: Quantify the gap to determine if extra investment is worthwhile.
   - **A.** Data collection -- currently 50% manual, ideally 100% automated
   - **B.** System interoperability -- currently manual export/import, ideally real-time sync
   - **C.** Mobile -- currently forced PC adaptation, ideally native experience

3. Is it worth making additional investment to close this gap?
Why ask: Prevents over-engineering.
   - **A.** Worth it -- IoT equipment upgrade investment recoverable in 6 months
   - **B.** Not worth it yet -- involves cross-department coordination, short-term benefits unclear
   - **C.** Phased approach -- digitize core functions first, upgrade incrementally

**P1 Candidates**

1. Are there parts that can be solved without technology?
   - **A.** Yes -- process standardization issues can be addressed with new policies before building a system
   - **B.** Yes -- data quality issues can be improved through training
   - **C.** Yes -- department collaboration issues, a meeting to align responsibilities might be faster than development
   - **D.** No -- all require a system solution

2. Can this requirement be broken into several independent sub-problems?
   - **A.** Data collection / process management / report display -- three independent pieces
   - **B.** Frontend entry / backend approval / push notifications / data storage -- four parts
   - **C.** Split by role -- worker side (reporting + notifications), supervisor side (approval + dispatch), management (reports)

### Follow-up Techniques

- Do not jump from "optimal solution" directly to "implementation plan" -- quantify the gap first
- When asking "is it worth it?", provide cost reference (time, effort, risk)
- Parts that "can be solved without technology" are often overlooked but may be the fastest path

### Pitfalls

- Do not treat the "ideal solution" as the "phase 1 solution" -- the ideal is for calibrating direction
- Do not assume all problems require technical solutions
- Do not ignore organizational inertia and migration costs
