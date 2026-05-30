# Roadmap and Governance Patterns

Use this reference when building implementation, rollout, and operating model slides.

## 1. Standard Roadmap

Recommended phases:

1. **Diagnosis and blueprint**: current-state assessment, value pool, target blueprint, pilot scope.
2. **Pilot breakthrough**: one line, one plant, or one scenario proves value.
3. **Core build**: system integration, data foundation, process redesign, key scenarios.
4. **Scale rollout**: multi-line, multi-plant, or multi-domain rollout.
5. **Continuous operation**: KPI governance, improvement backlog, AI optimization.

Each phase must include:

- objective
- scope
- deliverables
- acceptance criteria
- owner
- risks

## 2. Pilot Selection Criteria

Choose a pilot with:

- visible business pain
- available data
- clear owner
- controllable scope
- measurable KPI
- replicable process
- manageable integration complexity

Avoid pilots that are politically important but technically impossible in the timeframe.

## 3. Stage Gates

Use stage gates instead of calendar-only roadmaps:

| Gate | Evidence |
|---|---|
| Diagnose complete | process map, baseline, system/data inventory |
| Pilot ready | data access, owner, acceptance criteria, integration plan |
| Pilot accepted | KPI result, user adoption, issue list, replication template |
| Scale ready | standard process, configuration template, training package |
| Operate ready | KPI owner, data owner, support model, improvement cadence |

## 4. Governance Model

Required roles:

- executive sponsor
- business owner
- process owner
- IT/system owner
- data owner
- KPI owner
- plant key user
- PMO
- implementation partner

Show governance as an action board or RACI-style table.

## 5. Data Governance

Every high-value dataset needs:

- source system
- business owner
- data owner
- quality rule
- update cadence
- downstream consumers
- issue handling mechanism

## 6. Change Management

Manufacturing systems fail when shop-floor users see only extra data entry.

Include:

- role-based training
- process simulation
- pilot super users
- shift-level support
- feedback loop
- KPI and behavior alignment

## 7. Common Risks and Mitigations

| Risk | Mitigation |
|---|---|
| unclear business owner | assign scenario owner before design freeze |
| weak master data | start data cleanup in diagnosis phase |
| equipment connectivity delay | define manual fallback and edge rollout plan |
| overlarge scope | use pilot with strict acceptance criteria |
| user resistance | reduce duplicate entry and show daily work benefit |
| fake KPI improvement | define baseline and formula before implementation |
| AI overpromise | limit AI to decision support until data and governance mature |
