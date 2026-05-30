# Slide Patterns

Use these patterns selectively. Do not force every deck to use every pattern.

## Consulting Exhibit Page

Best for: market analysis, strategy recommendation, competitive diagnosis, value proof, risk, and decision pages.

Layout:

- Top: action title that states the conclusion.
- Center: one dominant evidence object occupying 55-75% of the body.
- Side or bottom: 1-2 implication, source, or assumption blocks.
- Footer: source/confidence/assumption note when numbers appear.

Rules:

- The exhibit must prove the title.
- One slide should have one main reading path.
- Use `references/consulting-exhibit-system.md` when the page needs chart selection, density, or appendix rules.
- Prefer editable HTML/CSS charts, grids, tables, and matrices over screenshots or complex SVG.

## Cover / Section Divider

Best for: opening a deck or separating narrative stages.

Layout:

- One strong title or section claim.
- Optional local image or full-bleed visual only for cover/section pages.
- Minimal metadata: client, topic, date, version.

Rules:

- Cover should signal the topic, not become a dashboard.
- Section divider can be sparse; do not force evidence objects onto it.

## Single-Page Onepager

Best for: product overview, capability onepager, pilot proposal.

Layout:

- Title strip with one conclusion.
- Left 55-60%: main architecture, process, or value map.
- Right 40-45%: value points, key assumptions, next step.
- Bottom row: 3-5 KPI or scope cards.

## Two-Page Training / Enablement

Best for: internal sales training, tool explanation, before/after narrative.

Page 1:

- Comparison matrix or market/tool landscape.
- Right-side conclusion card explaining the decision.

Page 2:

- 4-6 step workflow.
- Output versions or operating rules.
- Screenshot placeholders using dashed boxes.

## Executive Summary

Best for: leadership review.

Layout:

- 3-4 storyline blocks: market/context, complication, recommendation, expected result.
- One quantitative evidence row or small scorecard.
- One decision or ask callout at the bottom.

Writing:

- Each takeaway starts with the business object: market, customer, order, delivery, inventory, quality, cost, risk.
- Use ranges when numbers are estimates.
- Do not put detailed model math here; move it to appendix.

## Market / Industry Exhibit

Best for: market sizing, growth, demand, regulation, benchmark, or industry structure.

Layout:

- Left or top: main chart such as bar, line, stacked bar, or ranked table.
- Right or bottom: 2-3 drivers explaining why the trend matters.
- Small note: source, period, geography, assumption.

Rules:

- Market size without a strategic implication is not enough.
- If data is estimated, use ranges and state the estimation basis.

## Customer / Segment Exhibit

Best for: customer segmentation, persona, purchase criteria, channel preference, or unmet need.

Layout:

- Main: segment matrix, ranked table, or journey map.
- Support: size/value, pain point, willingness, operational fit.
- Optional: 1-2 persona snapshots only after segment logic is clear.

Rules:

- Persona stories should not replace segment sizing or selection criteria.
- Keep segment names and decision criteria at the same granularity.

## Competitive Landscape

Best for: competitor comparison, positioning, capability gap, entry barrier.

Layout:

- Main: comparison matrix, 2x2 positioning, or benchmark bars.
- Support: criteria definitions and strategic implication.
- Highlight the recommended gap or differentiator.

Rules:

- Define axes or criteria before judging competitors.
- Avoid logo walls without evidence.

## Strategic Options

Best for: comparing alternative moves before recommending one.

Layout:

- 2-4 options as columns or rows.
- Criteria: value, feasibility, risk, time, capability fit.
- Bottom: recommended option and tradeoff.

Rules:

- Options should be real alternatives, not one answer plus filler.
- Show why rejected options are weaker.

## Prioritization Matrix

Best for: impact vs feasibility, value vs complexity, urgency vs readiness, pilot selection.

Layout:

- Center: editable 2x2 matrix.
- Points or labeled bubbles for options/scenarios.
- Side or bottom: selected priority and next action.

Rules:

- Axes must be decision-relevant and clearly labeled.
- Limit to 6-10 items; use a ranked table if there are more.

## Comparison Matrix

Best for: tool evaluation, solution tradeoff, current vs target.

Layout:

- 4-6 rows.
- 3-5 columns.
- Use green/amber/red tags sparingly.
- Keep each cell to one claim.

Rules:

- Use native `<table data-pptx-role="native-table">` when the matrix must be edited as one PowerPoint table.
- Use div/CSS shape grids only when the matrix is primarily a visual exhibit.

## Architecture

Best for: manufacturing IT/OT, platform capability, data flow.

Layout:

- 3-5 horizontal layers.
- Each layer contains 3-6 modules.
- Use text arrows between layers.
- Put integration assumptions in a bottom callout.

## Process / Pathway

Best for: implementation route, operating procedure, sales workflow.

Layout:

- 4-6 horizontal steps.
- One short title and one short description per step.
- Add a bottom risk or prerequisite row if needed.

## Timeline

Best for: rollout plan.

Layout:

- Phase blocks across a horizontal calendar.
- Milestones as small text labels.
- Use one row per workstream only when necessary.

## Action Board

Best for: follow-up plan.

Layout:

- Table columns: task, owner, due date, output.
- Use short nouns and deliverables.
- Avoid long prose.

## Diagnosis / Pain Points

Best for: current-state diagnosis, pain grouping, executive problem framing.

Layout:

- Top: one action title stating the business consequence.
- Middle: 3-5 pain cards grouped by process/system/data/organization.
- Bottom: root-cause or impact row with evidence assumptions.

Writing:

- Separate symptom from root cause.
- Use concrete objects: order, work order, lot, inventory, inspection, equipment.
- Avoid "system silo" without explaining which handoff fails.

## Maturity Heatmap

Best for: digital baseline, SIRI/acatech-style assessment, multi-plant comparison.

Layout:

- Rows: domains such as process, system, data, equipment, AI, governance.
- Columns: maturity levels or plants.
- Cells: solid color status with short editable text.
- Right or bottom: 2-3 priority gaps and next actions.

Rules:

- Include evidence or assumption behind each maturity score.
- Do not use precise scores without assessment data.

## Value Opportunity Map

Best for: connecting pain points to business value.

Layout:

- Left: value drivers such as delivery, quality, inventory, equipment, cost.
- Center: improvement levers.
- Right: KPI and confidence level.
- Bottom: assumptions and data needed.

Rules:

- Financial value should trace back to operational KPI.
- Use ranges when baseline is weak.

## Value Bridge / Financial Forecast

Best for: showing baseline-to-target movement, improvement levers, unit economics, or 3-year forecast.

Layout:

- Main: waterfall/bridge, forecast bars, or compact financial table.
- Support: operational drivers, formula notes, sensitivity or confidence.
- Appendix link/note when detailed model assumptions exist.

Rules:

- Never show financial impact without operational drivers.
- Exact values need baseline, formula, source, and period.
- Detailed financial model tables belong in native `<table>` appendix pages.

## Scenario Closed Loop

Best for: manufacturing use cases such as quality traceability, material kitting, equipment maintenance, exception handling.

Layout:

- 5-7 horizontal steps: trigger -> detect -> decide -> execute -> feedback -> KPI.
- A small system/data row under the process steps.
- A bottom acceptance-criteria row.

Rules:

- Each step should name one business object or system event.
- Do not present a scenario as a static feature list.

## Capability Boundary

Best for: clarifying ERP/MES/WMS/QMS/APS/TPM/PLM/Data/AI responsibility.

Layout:

- Matrix: capability rows x system columns.
- Use short role labels: Owns, Provides, Consumes, Reviews.
- Add bottom note for system of record and handoff event.

Rules:

- Use when customers argue about which system should own a process.
- Do not use as a product module checklist.

## Data Flow / Object Handoff

Best for: explaining cross-system integration and traceability.

Layout:

- Left-to-right object flow.
- Each block: system + object + event.
- Bottom: governance controls such as owner, quality rule, retry, audit.

Rules:

- Name the object being handed off, not only the interface technology.
- Prefer text arrows and boxes over complex diagrams.

## KPI Tree

Best for: showing how operational KPI links to financial or management outcome.

Layout:

- Top: business outcome.
- Middle: 2-4 operational KPI branches.
- Bottom: data source, owner, confidence.

Rules:

- Include formula or measurement note when used as evidence.
- Do not mix Level A exact values with Level C directional assumptions.

## Risk and Mitigation

Best for: market entry risk, rollout risk, data risk, implementation risk, AI governance risk.

Layout:

- Left/main: risk heatmap or risk list grouped by trigger.
- Right/bottom: mitigation table with owner, action, timing, and guardrail.
- Optional: stage-gate rule for high-risk actions.

Rules:

- Risk should include trigger, impact, and owner.
- Do not leave risk as generic caution text.

## Appendix Model Table

Best for: financial model, unit economics, benchmark detail, survey questionnaire, assumptions, detailed source table.

Layout:

- Dense editable table with clear grouping and units.
- Top title states what the model proves.
- Bottom note explains source, scope, formula, and limitations.

Rules:

- Appendix may be dense but still must be readable.
- Use semantic `<table data-pptx-role="native-table">` so PowerPoint users can edit rows, columns, and cells as one table.
- Do not paste spreadsheet screenshots.

## Governance Board

Best for: implementation ownership, rollout governance, data governance.

Layout:

- Table columns: role, decision, cadence, output, risk.
- Optional RACI tags if needed.
- Bottom: stage-gate or escalation rule.

Rules:

- Use role names, not only departments.
- Assign data owner and KPI owner when the deck depends on data or value realization.
