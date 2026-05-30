# PPTX Conversion Rules

Use this reference as a preflight checklist before returning an HTML deck.

## Hard Requirements

- Use `.S` for every slide.
- Use fixed slide size: `1080px x 608px`.
- Keep slides vertically stacked in the document body.
- Keep all required assets in the HTML itself, or use local relative assets only when the user explicitly needs images.
- Use normal HTML text for all content that should be editable in PowerPoint.
- Keep important content inside the slide bounds. Do not rely on browser scrolling inside a slide.

## Avoid When Editability Matters

These patterns often become pictures or overlays after conversion:

- screenshots used as slide content
- `<canvas>`
- complex inline SVG diagrams
- Mermaid-rendered diagrams
- `background-image`
- heavy gradients, shadows, blur, filters
- `clip-path`, masks, blend modes
- CSS pseudo-element content for labels
- transform-based scaling or rotation for core content
- remote web fonts and external icon libraries

## Safer Substitutes

| Need | Prefer |
|---|---|
| Architecture diagram | HTML/CSS boxes, layers, and text arrows |
| Editable table | semantic `<table data-pptx-role="native-table">` |
| Visual matrix / heatmap | CSS grid with `data-pptx-role="shape-matrix"` |
| Flowchart | flex/grid steps with text arrows |
| KPI dashboard | div cards with large text |
| Bar/ranking chart | CSS bars with real text labels and values |
| Waterfall/value bridge | stacked CSS blocks and editable labels |
| 2x2 matrix | CSS grid, axis labels, and real text points |
| Risk heatmap | CSS grid cells with real text |
| Appendix model | editable table/grid, not spreadsheet screenshot |
| Highlight | border-left accent, semantic color fill |
| Icon | short text label, simple Unicode arrow, or CSS shape |
| Screenshot placeholder | dashed box with text, not an actual screenshot unless provided |

## Chart and Exhibit Policy

For consulting exhibits, ordinary charts should stay editable:

- Use HTML/CSS for bar charts, value bridges, 2x2s, risk heatmaps, scorecards, and KPI trees.
- Keep axis labels, legends, values, source notes, and assumptions as normal DOM text.
- Avoid chart libraries for core exhibits unless the user accepts that charts may become images.
- Do not place critical labels inside SVG, canvas, screenshots, or background images.
- When exact chart geometry is less important than editability, prefer a clean approximate chart made from CSS bars/blocks.
- For dense financial data or any content requiring row/column editing, use native `<table>` markup instead of div grids or spreadsheet screenshots.

## Table Semantics Policy

Choose the editing target before writing markup:

- Use `<table data-pptx-role="native-table">` for action boards, assumptions, financial models, scorecards, risk mitigation, capability comparisons, and appendix data.
- Use div/CSS grids with `data-pptx-role="shape-matrix"` for visual matrices, heatmaps, 2x2s, KPI grids, ownership badges, and exhibit blocks.
- Do not use div grids for tables that users need to edit as tables in PowerPoint.
- Do not put nested charts, mini bars, or complex div layouts inside native table cells; split charts and tables into separate objects.
- After conversion, check the report's `Native PowerPoint tables` count. If it is lower than expected, the source HTML likely used div grids where native tables were needed.

## Image Policy

Use images only when the slide meaning depends on the actual image, such as product screenshots or customer site photos.

If images are required:

- Keep them as separate visual references, not containers for text.
- Do not put critical labels inside images.
- Use local relative paths next to the HTML file, or base64 only for small images.
- Tell the user those image areas will likely remain pictures in PPT.

## Converter Command

After the HTML is created, conversion is a separate step:

```bash
cd /path/to/html2ppt-sales-tool
npm run convert -- "/path/to/deck.html" --out "/path/to/output-folder"
```

Optional selector override:

```bash
npm run convert -- "/path/to/deck.html" --selector ".S"
```

Expected output files:

- `*_原始保真版.pptx`
- `*_推荐可编辑版.pptx`
- `*_最大可编辑版.pptx`
- `*_转换报告.md`

Default recommendation: open `*_推荐可编辑版.pptx` first.

## Final Check

Before finalizing, verify:

- `.S` count equals intended slide count.
- No external CDN dependencies.
- No large text hidden in images/SVG/canvas.
- Main tables, charts, and diagrams are text-based or CSS-structured.
- Tables that need table-level editing are semantic `<table>` elements and appear in the conversion report as native PowerPoint tables.
- Quantified exhibits include source, assumption, period, or confidence note.
- Page numbers match total pages.

## Manufacturing Deck Check

For manufacturing digital solution decks, also verify:

- maturity heatmaps use editable grid cells, not screenshots.
- scenario closed loops use HTML/CSS boxes and text arrows.
- architecture diagrams name business objects or events, not only system names.
- capability boundary matrices use text labels such as Owns / Provides / Consumes.
- KPI pages include source, owner, confidence, or assumptions when claims are quantified.
- AI workflow slides include human approval and audit text when write actions are discussed.
