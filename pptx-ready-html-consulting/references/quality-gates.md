# Quality Gates

Run these gates before final output. If any gate fails, revise the solution brief or split content into additional slides.

## 1. Manufacturing Solution Gate

For manufacturing digital solution decks, verify:

- Business thesis is explicit.
- Current-state facts or assumptions are stated.
- Pain points are separated from root causes.
- At least 3 concrete manufacturing objects appear: order, work order, lot, inventory, inspection, equipment, routing, location, shipment, KPI.
- Priority scenarios are closed loops, not feature lists.
- System responsibility boundaries are clear.
- Data prerequisites are named.
- AI claims name scenario, data, decision support, human boundary.
- Roadmap has phases and acceptance criteria.
- Governance names business owner, data owner, and KPI owner where relevant.

## 2. Consulting Story Gate

- Deck follows SCR/SCQA or a justified alternate structure.
- Every slide title is an action title.
- Read only titles: the story still makes sense.
- Each slide has one dominant message.
- Each table or matrix supports a decision.
- Avoid internal coaching language in customer-facing copy.

## 3. Consulting Exhibit Gate

For market, strategy, customer, competition, value, risk, or appendix-heavy decks, verify:

- each exhibit answers one decision question
- action title and dominant evidence object support the same conclusion
- chart/table/matrix labels are real editable text
- every quantified exhibit has source, assumption, period, or confidence note
- no decorative metric, chart, or icon is included only to fill space
- appendix pages hold detailed models instead of crowding body pages

Fail the gate if:

- a chart is present but the title does not explain the implication
- a page has 4+ evidence modules without a clear reading order
- exact values appear without baseline, source, or assumption

## 4. Table Semantics Gate

Before finalizing HTML, classify every table-like object:

| Object type | Required markup | Expected PPTX edit behavior |
|---|---|---|
| Native table | `<table data-pptx-role="native-table">` | one editable PowerPoint table |
| Shape matrix | div/CSS grid with `data-pptx-role="shape-matrix"` | separate editable shapes/text |
| Chart/table hybrid | chart and table as separate objects | chart as shapes, table as native table |

Use native tables for action boards, financial models, assumptions, risk mitigation, scorecards, capability comparison, and appendix data.

Use shape matrices for heatmaps, 2x2s, KPI grids, visual ownership maps, and compact exhibit blocks.

Fail the gate if:

- a row/column-editable table is implemented as div grid
- a generated "table" section does not state whether it is native-table or shape-matrix
- a native table cell contains nested charts, mini bars, or complex div layouts
- the conversion report's native PowerPoint table count is lower than the intended native table count

## 5. Quantification Gate

Use confidence levels:

- Level A: exact values only with baseline, formula, source.
- Level B: ranges with assumptions.
- Level C: directional statement only.

Fail the gate if:

- pseudo-precision appears without source
- KPI has no owner or data source when used as proof
- financial impact is asserted without operational driver

## 6. Layout and Density Gate

| Element | Minimum | Recommended |
|---|---:|---:|
| Slide title | 18px | 20-26px |
| Card title | 11px | 12-15px |
| Body text | 10px | 10.5-12px |
| Table text | 9px | 9.5-10px |
| Tag/label | 8.5px | 9-10px |
| Footer/meta | 8px | 8.5-9px |

Rules:

- Standard mode: max 3 major blocks and 1 heavy structure.
- Dense Exhibit mode: max 4 major blocks and 2 heavy structures, with one visible reading path.
- Appendix mode: dense tables allowed, but title must explain what the model proves.
- Max 12 bullets per standard slide.
- Max 4 lines per card body.
- One dominant visual region per slide.
- Split the slide if table text would fall below 8.5px or a reader must compare more than 7 peer items.

## 7. Anti-Empty-Frame Gate

Every major block must include at least one:

- concrete business object
- factual claim or assumption
- decision implication

Do not leave large blank frames with only a title and one weak sentence. Merge, remove, or add evidence.

## 8. Appendix Gate

Use appendix pages for:

- financial models and unit economics
- detailed assumptions and formulas
- source tables and benchmark lists
- survey questionnaires or interview detail
- sensitivity analysis

Verify:

- body slide states the conclusion; appendix stores detail
- appendix title says what the table/model proves
- units, period, geography, and source are visible
- appendix model tables use semantic `<table>` when row/column editing matters
- no spreadsheet screenshot is used when an editable table can be built

## 9. PPTX Conversion Safety Gate

Verify:

- all slides use `.S`
- fixed size `1080px x 608px`
- no external CDN, fonts, or images by default
- no canvas
- no Mermaid by default
- no complex inline SVG for core content
- no `transform`, `filter`, `clip-path`, `mix-blend-mode`
- no text in CSS pseudo-elements
- no canvas or SVG-based chart for ordinary bar/line/waterfall/matrix exhibits
- native tables use `<table data-pptx-role="native-table">`
- visual matrices use div/CSS grid with `data-pptx-role="shape-matrix"`
- diagrams use HTML/CSS boxes and text arrows
- charts use editable text labels and simple CSS bars/shapes when possible
- footer and page numbers are regular text

Conversion safety overrides visual ambition.
