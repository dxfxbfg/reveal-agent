# Manufacturing Methodologies

Use these methods as anchors for manufacturing digital transformation decks. They prevent unsupported claims and help choose the right slide pattern.

## Method Quick Map

| Method | Use when | Output | Best slide patterns |
|---|---|---|---|
| APQC PCF | process scope and ownership are unclear | L1-L3 process map, owner matrix, process gap list | Architecture, Gap Analysis, Action Board |
| ISA-95 / IEC 62264 | IT/OT or enterprise-to-shopfloor integration is central | system responsibility by level, object handoff, event contract | Architecture, Data Flow, Capability Boundary |
| ISO 22400 | manufacturing KPI needs definition | KPI tree, metric card, baseline/target/governance | KPI Dashboard, KPI Tree |
| SIRI | digital maturity baseline is needed | maturity score, gap heatmap, initiative priority | Maturity Heatmap, Timeline |
| acatech Industrie 4.0 | staged transformation roadmap is needed | maturity stage, stage gate, capability package | Timeline, Roadmap |
| RAMI 4.0 | architecture completeness needs checking | coverage matrix across layers/hierarchy/lifecycle | Architecture, Matrix |
| SCOR | supply chain performance is central | Plan-Source-Make-Deliver-Return process and KPI linkage | Value Chain, KPI Dashboard |
| VSM / OEE / FMEA | shop-floor loss and quality risk need analysis | loss map, OEE decomposition, risk priority | Diagnosis, Root Cause, Action Board |

## APQC PCF

Use for process decomposition and ownership boundaries.

Ask:

- Which end-to-end process is in scope?
- Where are handoffs, waiting, rework, and owner conflicts?
- Which process owner, IT owner, and KPI owner act on each gap?

If evidence is weak, present a process hypothesis and request workshop validation.

## ISA-95 / IEC 62264

Use for manufacturing system architecture and IT/OT integration.

Typical layers:

- Enterprise: ERP, PLM, finance, customer order.
- Operations/MOM: MES, WMS, QMS, APS, TPM/EAM.
- Control: SCADA, PLC, DCS, machine controllers.
- Physical: equipment, sensor, line, workstation.

Core objects:

- product, material, lot/batch, work order, operation, equipment, personnel, quality result.

Do not draw system arrows without naming the business object or event that moves.

## ISO 22400

Use for KPI design and metric governance.

KPI card should include:

- metric name
- formula or definition
- owner
- baseline
- target or target range
- data source
- refresh cadence
- action trigger

If baseline is missing, use a range or directional statement and list required data.

## SIRI and acatech

Use for maturity and roadmap.

Practical dimensions:

- process integration
- system integration
- data availability
- equipment connectivity
- analytics/AI capability
- organization and governance

Roadmap should use stage gates, not only calendar phases.

## RAMI 4.0

Use for architecture coverage checks.

Map capabilities across:

- lifecycle: type, instance
- hierarchy: product, field device, control, station, work center, enterprise, connected world
- layers: asset, integration, communication, information, function, business

In customer-facing decks, simplify to a coverage matrix. Avoid exposing the full cube unless it helps the audience.

## SCOR

Use for supply chain and order fulfillment performance.

Map:

- Plan
- Source
- Make
- Deliver
- Return

Link to:

- reliability
- responsiveness
- agility
- cost
- asset management

## VSM / OEE / FMEA

Use for factory-floor diagnosis.

- VSM: separates value-added and non-value-added time.
- OEE: decomposes availability, performance, and quality losses.
- FMEA: prioritizes failure risk by severity, occurrence, and detection.

These methods should produce concrete actions, not just diagnostic diagrams.

## Minimum Method Discipline

- KPI claims need ISO 22400, OEE, SCOR, or clearly stated business metric logic.
- Architecture claims need ISA-95, RAMI 4.0, or explicit system responsibility mapping.
- Roadmap claims need maturity stage, dependency, or stage-gate logic.
- If no method anchor is available, downgrade confidence and state assumptions.
