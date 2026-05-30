---
name: pptx-ready-html-consulting
description: >
  Use when the user asks for manufacturing digital transformation, smart factory,
  MOM/MES/WMS/QMS/TPM/APS, Industry 4.0, AI for manufacturing, or sales/presales
  solution decks that must be delivered as consulting-grade, PPTX-ready HTML for
  later conversion into editable PowerPoint, especially when pages need exhibit
  logic, charts, dense evidence layouts, appendix models, or board-style decision
  pages.
---

# PPTX-Ready HTML Consulting

## Boundary

This skill creates **consulting-grade HTML slides optimized for later PPTX conversion**. It does not directly generate `.pptx`.

If the user asks for a final PowerPoint file, first create or revise the HTML with this skill, then use the separate HTML-to-PPTX conversion tool.

For manufacturing digital transformation topics, this skill first builds the solution logic, then creates slides. Do not jump directly from raw notes to page layout.

This skill adds a consulting-exhibit layer: each important slide should behave like a decision exhibit, not a decorative web page. Use editable HTML/CSS charts, tables, matrices, and diagram blocks that survive conversion to PowerPoint.

## Workflow

1. **Determine mode**:
   - Manufacturing Digital Solution Mode: manufacturing transformation, MOM/MES/WMS/QMS/TPM/APS, smart factory, Industry 4.0, AI for manufacturing.
   - General Consulting HTML Mode: non-manufacturing consulting slides that still need PPTX-ready HTML.
   - Consulting Exhibit Mode: strategy, market, competition, customer, financial, operating, risk, or appendix-heavy decks where evidence pages need charts, tables, matrices, or dense exhibit layouts.
2. Clarify only blocking items: audience, topic, page count, deck type, and output path. Use reasonable assumptions when speed matters.
3. If in Manufacturing Digital Solution Mode, create an internal **Solution Brief** before slide design. Read only the relevant references:
   - `references/manufacturing-solution-framework.md` for the overall solution spine.
   - `references/enterprise-diagnosis-checklist.md` when current-state diagnosis is needed.
   - `references/manufacturing-scenario-library.md` when selecting business scenarios.
   - `references/manufacturing-capability-map.md` and `references/architecture-patterns.md` when system/data/AI architecture is needed.
   - `references/value-kpi-library.md` when value or KPI claims are needed.
   - `references/roadmap-governance-patterns.md` when implementation, rollout, or governance is needed.
   - `references/manufacturing-methodologies.md` when a method anchor is needed for process, KPI, maturity, architecture, or shop-floor loss analysis.
4. Convert the Solution Brief or raw material into a consulting storyline using SCR/SCQA and action-title sequencing. Use `references/consulting-frameworks.md` for structure.
5. For evidence-heavy pages, read `references/consulting-exhibit-system.md` to choose density, chart, evidence, appendix, and source treatment.
6. Choose slide archetypes from `references/slide-patterns.md`.
7. Build one self-contained `.html` file using `references/design-system.md` and `assets/base-template.html` as the base.
8. Run the quality gates in `references/quality-gates.md`.
9. Apply the conversion constraints in `references/pptx-conversion-rules.md` as the final preflight.
10. If the user wants conversion afterward, provide the exact conversion command separately.

## Internal Solution Brief

For manufacturing digital solution work, draft this internally before slide generation:

| Field | Required thinking |
|---|---|
| Industry and model | segment, manufacturing type, order model, plant scope |
| Business thesis | why change now: growth, cost, delivery, quality, flexibility, compliance, service model |
| Current-state assumptions | business, process, system, data, organization, IT/OT facts or assumptions |
| Pain and root cause | separate symptoms, pain, root causes, and business impact |
| Value opportunities | cost, efficiency, quality, delivery, risk, growth |
| Priority scenarios | 2-5 closed loops with trigger, systems, data, and KPI |
| Target blueprint | business capability, system role, data flow, AI use, operating mechanism |
| Roadmap and governance | pilot, core build, scale, owners, PMO, stage gates |
| KPI confidence | exact/range/directional with source or assumption |
| Open questions | information needed before customer-ready precision |

Do not expose the full Solution Brief in final slides unless the user asks for working notes.

## Manufacturing Method Discipline

Use method anchors when claims need support:

- APQC / VSM for process decomposition and handoff diagnosis.
- ISA-95 / RAMI 4.0 for IT/OT, system responsibility, and architecture coverage.
- ISO 22400 / OEE / SCOR for manufacturing KPI design.
- SIRI / acatech for maturity assessment and staged roadmap.
- FMEA for quality risk and mitigation planning.

Customer-facing slides should use concrete business language first. Do not show methodology names just to sound authoritative.

## Quantification Discipline

- High confidence: exact value allowed only with baseline, formula, and source.
- Medium confidence: use ranges and write assumptions.
- Low confidence: use directional wording and list required data.

Avoid pseudo-precision when data is missing.

## Consulting Exhibit Discipline

Use this discipline for market, strategy, value, diagnosis, risk, and appendix-heavy pages.

Each exhibit slide needs:

- one action title that states the conclusion
- one dominant evidence object: chart, table, map-like grid, matrix, KPI tree, architecture, or process flow
- 0-2 support blocks: implication, assumption, source, benchmark, or decision note
- explicit source/assumption/confidence text when data is quantified
- no decorative chart or metric that does not support the slide title

Pick the visual by the question:

| Question | Preferred exhibit |
|---|---|
| Is the market growing? | bar/line/stacked bar with CAGR note |
| Where is growth or loss coming from? | waterfall / value bridge |
| Which segment matters most? | segmentation matrix or ranked table |
| Which option should we choose? | 2x2 priority matrix or weighted scorecard |
| Where should rollout start? | region grid/map substitute + ranked city/plant table |
| How does value translate to money? | KPI tree + financial bridge |
| What can go wrong? | risk heatmap + mitigation table |
| How will it land? | roadmap / Gantt / governance board |

Use editable HTML/CSS for ordinary charts. Do not use canvas, complex SVG, screenshots, Mermaid, or background images for core exhibits unless the user accepts weaker PPT editability.

## Native Table vs Shape Matrix Discipline

Decide the editing target before choosing HTML structure:

| Target | Use | PPTX result |
|---|---|---|
| `native-table` | `<table data-pptx-role="native-table">` | one editable PowerPoint table object |
| `shape-matrix` | div/CSS grid with `data-pptx-role="shape-matrix"` | multiple editable shapes/text boxes |
| `chart-table-hybrid` | split chart and table into separate objects | chart remains shapes; table can stay native |

Use native tables when users will likely insert/delete rows or columns, edit cells as a table, copy into Excel, or adjust table layout in PowerPoint. Examples: financial model, assumptions, risk mitigation, action board, scorecard, capability comparison, appendix tables.

Use shape matrices for visual exhibits where cell-level color, tags, and layout matter more than row/column editing. Examples: maturity heatmap, 2x2 priority matrix, risk heatmap, compact KPI grid, capability boundary with visual ownership marks.

Do not call a div grid a "table" in generated code or comments. Name it matrix, heatmap, scorecard, or shape grid so the editing expectation is explicit.

## Density and Appendix Discipline

Choose density intentionally:

| Mode | Use for | Rule |
|---|---|---|
| Standard | regular storyline pages | 1 dominant object + 1 support area |
| Dense Exhibit | market, diagnosis, value proof, competition | 2-4 evidence modules, one clear reading order |
| Appendix | financial model, assumptions, survey, benchmark | dense tables allowed, but title must state why the page exists |

If a page needs more than 4 evidence modules or text below 8.5px, split it into a body exhibit and an appendix page. The body slide shows the answer; the appendix keeps the model, formula, assumptions, or raw table.

## Narrative Structure

Every multi-slide deck follows **Situation → Complication → Resolution → Evidence → Closing**:

| Stage | Rhetorical purpose | Typical slide types |
|---|---|---|
| Situation | Shared context and business thesis | Cover, industry backdrop, market sizing, enterprise baseline |
| Complication | Pain, gap, root cause, risk | Diagnosis, gap analysis, root cause, maturity heatmap, competition/customer exhibit |
| Resolution | Proposed answer | strategy options, scenario closed loop, architecture, capability boundary, roadmap |
| Evidence | Proof and value | KPI dashboard, KPI tree, value bridge, financial forecast, pilot acceptance |
| Closing | Next step | action board, governance, decision request, appendix index |

For single-page onepagers, compress the narrative into one slide: action title = resolution, body = context + priority scenario + value + assumptions.

## Action Title Rules

Every slide title must be a conclusion, not a topic label.

| Bad | Good |
|---|---|
| 质量追溯方案 | 批次 genealogy 与质量状态联动后，追溯时间可从小时级降到分钟级 |
| 系统架构 | ISA-95 分层明确 ERP、MOM 与设备层边界，减少跨系统责任冲突 |
| AI 能力 | AI 先用于问数和异常诊断，写操作保留人工审批 |

Rules:

- Complete sentence, max 40 Chinese characters when possible.
- Specific and quantitative when evidence exists.
- If evidence is weak, state the assumption.
- Reader should understand the point without reading the body.

## Slide Archetypes

Use `references/slide-patterns.md` for layout details. Common manufacturing deck patterns:

| Type | Use for |
|---|---|
| Executive Summary | leadership conclusions and requested decisions |
| Market / Industry Exhibit | market size, trend, growth, demand, regulatory or benchmark evidence |
| Customer / Segment Exhibit | persona, segment attractiveness, needs, journey, purchase criteria |
| Competitive Landscape | competitor positioning, capability comparison, share, entry barrier |
| Strategic Options | option set, tradeoff, recommended path, decision rationale |
| Prioritization Matrix | impact vs feasibility, value vs complexity, urgency vs readiness |
| Diagnosis / Pain Points | current-state pain and business impact |
| Maturity Heatmap | digital baseline and priority gaps |
| Root Cause / Issue Tree | why the problem occurs |
| Value Opportunity Map | value pools by process or KPI |
| Value Bridge / Financial Forecast | operational lever to financial result, baseline-to-target logic |
| Scenario Closed Loop | trigger-to-action-to-feedback business scenario |
| Capability Boundary | system ownership and handoff definition |
| Architecture / Data Flow | system, data, AI, and IT/OT architecture |
| KPI Dashboard / KPI Tree | baseline, target, owner, source, confidence |
| Risk and Mitigation | risk heatmap, mitigation actions, decision guardrails |
| Timeline / Roadmap | staged rollout and acceptance criteria |
| Action Board / Governance | owner, action, due date, output |
| Appendix Model Table | assumptions, model details, source table, survey or benchmark detail |

## Required HTML Contract

All output intended for PPTX conversion must follow this contract:

- Use one self-contained HTML file.
- Use 16:9 slides by default: `1080px x 608px`.
- Each slide must be a direct block with class `.S`, for example `<section class="S" id="p01">`.
- Keep all CSS inside `<style>`.
- Do not rely on external CSS, remote fonts, remote images, or CDN scripts.
- Use real text nodes for all readable content. Do not place important text in images, CSS `content`, canvas, or SVG text.
- Prefer CSS grid/flex, borders, fills, and text blocks over screenshots or complex vector art.
- Use semantic `<table>` for content that must remain a single editable PowerPoint table. Use div/CSS grids only for shape-level matrices and visual exhibits.
- Include print color preservation: `print-color-adjust: exact; -webkit-print-color-adjust: exact;`.

## Design Direction

Default style is restrained consulting delivery:

- White or very light background, navy header, gray borders, semantic accent colors.
- Dense enough for B2B sales/presales, but not micro-text.
- Action-title first: each slide title states the conclusion, not just the topic.
- Tables, editable charts, architecture layers, process flows, KPI cards, comparison matrices, value bridges, 2x2s, and timeline blocks are preferred.
- Use color as meaning: blue for structure, green for advantages/results, amber for attention, red for risk/problem.
- Use a client/industry accent color when useful, but do not hard-code any consulting firm's visual identity.
- Covers and section dividers may use real local imagery when it helps the deck feel concrete; body slides should prioritize editable evidence objects.

For exact tokens and components, read `references/design-system.md`.

## Conversion-Friendly Rules

Before returning an HTML deck, check:

- Slides use `.S`, not arbitrary page containers.
- No layout-critical `transform`, `filter`, `clip-path`, `mix-blend-mode`, canvas, or screenshot-based blocks.
- Gradients and shadows are limited to covers or nonessential decoration.
- Spreadsheet-like tables use `<table data-pptx-role="native-table">`; visual matrices use div/CSS grid and should be marked `data-pptx-role="shape-matrix"`.
- Flowcharts and architecture diagrams use HTML/CSS boxes and connector text/arrows.
- Mermaid is avoided unless the diagram is too complex for CSS and the user accepts lower editability.
- Footer/page numbers are regular text, not CSS pseudo-elements.

For the detailed checklist, read `references/pptx-conversion-rules.md`.

## Output Expectations

When generating HTML:

- Write the finished `.html` file.
- Keep the file portable and self-contained.
- Name slides with stable IDs: `p01`, `p02`, etc.
- If user material is sparse, create a polished draft using explicit assumptions, not fake precision.
- If user material is long, synthesize into a coherent deck rather than copying paragraphs.
- For manufacturing solution decks, make scenario, architecture, roadmap, and KPI assumptions explicit.

When giving conversion instructions, keep it separate from the HTML generation step:

```bash
cd /path/to/html2ppt-sales-tool
npm run convert -- "/path/to/deck.html" --out "/path/to/output-folder"
```

The recommended PPTX for sales editing is usually the generated `*_推荐可编辑版.pptx`.

## Quality Gate

Before final response:

- For manufacturing decks, check against `references/verification-rubric.md` when practical.
- Run all gates in `references/quality-gates.md`.
- Open or inspect the generated HTML enough to catch layout-breaking syntax.
- Confirm it contains one or more `.S` slides.
- For multi-page decks, confirm slide count and page labels align.
- Mention any known conversion risks, such as complex SVG, Mermaid, external assets, or intentional gradients.
