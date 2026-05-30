# Value and KPI Library

Use this reference to express manufacturing value without fake precision.

## Quantification Confidence

| Level | Use when | Expression |
|---|---|---|
| A high | baseline, formula, and source are available | exact value allowed |
| B medium | comparable benchmark or rough baseline exists | range preferred |
| C low | no baseline or source | directional wording only |

Never use precise numbers such as `8.6%` or `3172万` without Level A evidence.

## Delivery KPIs

| KPI | Definition | Data source | Value lever |
|---|---|---|---|
| OTIF | delivered on time and in full | ERP, shipment, customer order | planning reliability, material readiness |
| schedule adherence | actual execution vs released schedule | APS, MES | stable dispatch, exception handling |
| order lead time | order received to shipped | ERP, MES, WMS | reduce waiting and rework |
| expedite ratio | urgent orders or manual interventions | ERP, APS | better demand and constraint visibility |

## Production KPIs

| KPI | Definition | Data source | Value lever |
|---|---|---|---|
| OEE | availability x performance x quality | MES, SCADA, QMS | downtime, speed loss, scrap reduction |
| plan attainment | completed plan vs scheduled plan | APS, MES | schedule discipline and material readiness |
| throughput | output per time period | MES | bottleneck improvement |
| WIP accuracy | actual WIP vs system WIP | MES, barcode/RFID | real-time reporting |
| report timeliness | time from operation completion to system update | MES | terminal/mobile reporting |

## Quality KPIs

| KPI | Definition | Data source | Value lever |
|---|---|---|---|
| FPY | first-pass yield | QMS, MES | process control and defect prevention |
| defect rate | defects per unit/batch | QMS | inspection and process feedback |
| rework rate | reworked quantity / total quantity | MES, QMS | root cause closure |
| traceability time | time to produce genealogy and affected scope | MES, WMS, QMS | lot/serial genealogy |
| NCR cycle time | NCR creation to closure | QMS | responsibility and workflow |

## Inventory KPIs

| KPI | Definition | Data source | Value lever |
|---|---|---|---|
| inventory turns | COGS / average inventory | ERP, WMS | reduce excess and slow-moving stock |
| stock accuracy | physical vs system inventory | WMS, ERP | barcode/RFID, cycle count |
| kitting rate | complete kits / required kits | WMS, MES | material availability check |
| obsolete inventory | slow-moving or expired stock | ERP, WMS | demand and quality status visibility |

## Equipment KPIs

| KPI | Definition | Data source | Value lever |
|---|---|---|---|
| downtime | unavailable production time | SCADA, MES, EAM | alarm response and maintenance |
| MTBF | mean time between failures | EAM, SCADA | preventive maintenance |
| MTTR | mean time to repair | EAM | diagnosis and spare-part readiness |
| maintenance compliance | completed planned maintenance / planned maintenance | EAM | maintenance discipline |

## Collaboration KPIs

| KPI | Definition | Data source | Value lever |
|---|---|---|---|
| exception closure time | exception opened to closed | workflow, MES, QMS | ownership and escalation |
| manual entry count | repeated manual data inputs | process survey, system logs | integration and mobile reporting |
| report preparation time | time to create recurring operation report | BI, survey | semantic model and AI question answering |
| decision latency | event occurred to responsible action | event log, workflow | alert and owner mechanism |

## Financial Translation

Translate operational value cautiously:

- inventory reduction -> cash release and carrying cost reduction
- scrap/rework reduction -> material and labor saving
- downtime reduction -> output recovery or overtime reduction
- delivery improvement -> penalty reduction or revenue protection
- reporting automation -> labor time saving, not always headcount reduction

When unsure, write the operational KPI first and financial impact as an assumption.

## KPI Card Format

Use this structure on value pages:

```text
Metric: 追溯时间
Baseline: 4小时~1天（待客户确认）
Target: 5~15分钟
Source: MES/WMS/QMS genealogy and inspection data
Owner: 质量经理
Confidence: Level B
```
