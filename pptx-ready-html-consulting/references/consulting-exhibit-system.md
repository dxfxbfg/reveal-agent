# Consulting Exhibit System

Use this reference when a deck needs strategy-consulting page logic: market evidence, customer analysis, competition, prioritization, value proof, risk, implementation, or appendix models.

## Page Grammar

Every exhibit page should answer one decision question.

```text
Action title
  -> dominant evidence object
  -> implication / recommendation
  -> assumption / source / confidence
```

Rules:

- The title is the conclusion; the exhibit proves it.
- A viewer should identify the main evidence in 3 seconds.
- Supporting modules explain "so what", not unrelated facts.
- If the slide has more than one possible takeaway, split it.
- If a chart has no decision implication, remove it.

## Density Modes

| Mode | Use for | Max structure | Notes |
|---|---|---:|---|
| Standard | recommendation, solution, roadmap | 1 heavy object + 1 support block | Default for live presentation |
| Dense Exhibit | market, competition, customer, diagnosis, value proof | 1 main object + 2-3 supporting modules | High signal, still one reading order |
| Appendix | financial model, unit economics, assumptions, survey, benchmark | dense table/model allowed | Title states what the model proves |

Avoid solving density by shrinking text. Move detail to appendix when body text would go below 8.5px or table cells need more than two lines.

## Table Semantics

Do not choose table markup by visual style alone. Choose by how the PowerPoint will be edited:

- Use `<table data-pptx-role="native-table">` for content that should remain one editable PowerPoint table: model tables, assumptions, action boards, risk mitigation, scorecards, and capability comparisons.
- Use div/CSS grids with `data-pptx-role="shape-matrix"` for visual exhibits: heatmaps, 2x2 matrices, score badges, ownership maps, and compact KPI grids.
- Split chart/table hybrids into two objects. Keep the chart as shapes and the table as native `<table>`.
- Avoid nested charts or mini-bars inside native table cells; they reduce table editability and conversion predictability.

## Exhibit Layouts

| Layout | Best for | Structure |
|---|---|---|
| 60/40 evidence | market chart, map substitute, financial bridge | left/main 60%, right implication 40% |
| top evidence + bottom proof | trends, value waterfall, forecast | main exhibit top, assumptions/source bottom |
| three proof columns | executive summary, market drivers | three equal evidence columns with a bottom answer bar |
| matrix center + side decision | 2x2, priority, competition | matrix owns the center; recommendation sits right/bottom |
| map substitute + ranked table | region/city/plant rollout | simple region grid or local image, plus ranked table |
| model body + appendix detail | financial model, unit economics | body slide shows conclusion; appendix stores full math |

Do not turn every slide into cards. Use boxes only when they organize a real table, chart, workflow, matrix, or artifact.

## Chart Selection

| Decision question | Recommended exhibit | Avoid |
|---|---|---|
| Is the market attractive? | bar/line/stacked bar, CAGR note | unlabeled decorative growth arrow |
| What drives the delta? | waterfall / bridge | unexplained before/after numbers |
| Which customer matters? | segmentation matrix, persona table, purchase criteria | generic persona cards without sizing |
| Who wins and why? | competitor matrix, benchmark table, positioning 2x2 | logo wall without criteria |
| Where to start? | priority 2x2, ranked city/plant table, region grid | map alone without rationale |
| What value will land? | KPI tree, value bridge, operating metric dashboard | financial result without operational driver |
| What is the operating model? | process flow, capability boundary, governance board | feature checklist |
| What risk needs action? | risk heatmap + mitigation table | risk list without owner or trigger |

Use ranges when data is directional. Exact values need baseline, formula, and source or a clearly labeled assumption.

## Consulting Page Types

### Market Overview Exhibit

- One market thesis.
- 1-2 trend charts or ranked tables.
- Growth, margin, demand, regulation, or behavior driver.
- Bottom note: source, year, assumption, or confidence.

### Customer / Segment Exhibit

- Segment definition and attractiveness logic.
- Size/value, pain, willingness, channel, and operational fit.
- Use a matrix or ranked table before persona stories.

### Competitive Landscape

- Define comparison criteria before judging competitors.
- Use 2x2 only when the axes explain a real strategic choice.
- Use matrix/table when the buyer must compare capabilities.

### Strategic Options

- Show 2-4 realistic options, not a single disguised answer.
- Compare by value, feasibility, risk, time, and capability fit.
- Make the chosen option visually clear and justify tradeoffs.

### Financial / Value Exhibit

- Connect operational lever -> KPI -> financial result.
- Use waterfall/bridge for baseline-to-target movement.
- Put detailed formulas in appendix when they crowd the slide.

### Risk and Mitigation

- Risk = trigger + impact + owner, not vague concern.
- Pair heatmap with mitigation table.
- Name decision guardrails or stage gates when relevant.

### Appendix Model

- Dense is acceptable, but no mystery tables.
- Title says what the table proves.
- Include source, scope, period, formula, and assumption notes.
- Keep appendix editable; avoid pasted spreadsheet screenshots.

## Visual Style

- Use clean white/light backgrounds and strong horizontal alignment.
- Use one accent color per deck unless color encodes categories.
- Footnotes are small but readable; keep them as real text.
- Client or industry imagery is useful for cover/section pages, not as proof unless it is a real site/product/customer photo.
- Do not copy the visual identity of Bain, McKinsey, BCG, or another firm. Absorb the exhibit grammar, not the brand skin.
