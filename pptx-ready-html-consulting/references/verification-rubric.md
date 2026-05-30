# Verification Rubric

Use this rubric to test whether the skill produces manufacturing digital solution content, not only attractive slides.

## Static Skill Checks

- `SKILL.md` links all required references directly.
- No reference links point outside this skill folder.
- PPTX conversion rules are still present and final.
- Manufacturing references do not require external tools.
- No default Mermaid/CDN dependency is introduced.

## Pressure Test Inputs

### A. One-line demand

Input:

> 汽车零部件企业要做生产执行和质量追溯一体化，希望体现 AI 能力和分阶段实施路径。

Expected:

- solution brief before slide design
- production execution and quality traceability scenarios
- system/data/AI architecture
- roadmap and KPI assumptions

### B. Messy meeting notes

Input includes:

- ERP and MES exist
- WMS is manual
- quality traceability relies on Excel
- equipment data is not connected
- management cares about delivery and inventory
- shop-floor users complain about duplicate entry

Expected:

- structured diagnosis
- root causes separated from symptoms
- priority scenarios selected
- no "do everything" roadmap

### C. Executive three-year roadmap

Input:

> Group leadership wants a three-year smart manufacturing roadmap for five plants.

Expected:

- maturity baseline assumptions
- target operating model
- multi-plant rollout logic
- governance and stage gates

### D. Product material to solution

Input:

> Convert MES/WMS/QMS product functions into a customer-facing solution proposal.

Expected:

- product functions converted to scenarios
- business value and implementation route
- system responsibility boundaries

### E. AI manufacturing proposal

Input:

> Customer wants AI in the manufacturing digital solution but has no clear scenario.

Expected:

- AI question answering, exception diagnosis, predictive maintenance, scheduling assistance as optional scenarios
- data prerequisite and human approval boundary
- no generic AI claims

### F. Low-data situation

Input:

> No baseline KPI is available.

Expected:

- no fake exact numbers
- assumptions, ranges, or directional claims
- list of data needed before investment case

## Scoring Table

| Dimension | Points | Pass condition |
|---|---:|---|
| Solution completeness | 20 | business thesis, diagnosis, value, blueprint, roadmap are present |
| Manufacturing specificity | 20 | concrete objects and scenarios are present |
| Scenario closed loop | 15 | trigger, process, system, data, KPI are connected |
| Architecture credibility | 15 | system/data/AI/IT-OT boundaries are clear |
| Quantification discipline | 10 | confidence and assumptions are clear |
| Consulting expression | 10 | action titles and SCR/MECE logic are visible |
| Sales usability | 10 | deck can be explained and edited by presales |

80+ is acceptable. 90+ is strong.

## Delivery Checks

For generated HTML:

- `.S` count equals intended slide count.
- visible text is real HTML text.
- no external assets unless explicitly required.
- no layout overflow.
- no complex SVG/canvas/Mermaid by default.
- the most complex diagram uses editable boxes and text arrows.
- conversion risks are mentioned in final response.
