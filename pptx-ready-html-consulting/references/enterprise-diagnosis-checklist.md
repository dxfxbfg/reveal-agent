# Enterprise Diagnosis Checklist

Use this before building a manufacturing digital solution deck. The goal is to avoid generic "digital platform" slides by grounding the proposal in business, process, system, data, organization, and IT/OT facts.

## 1. Business Baseline

Capture or infer:

- Industry segment: automotive parts, electronics, equipment, medical, food, chemical, battery, metal, etc.
- Manufacturing type: discrete, process, mixed, batch, continuous.
- Order model: MTO, MTS, ATO, ETO, project manufacturing.
- Plant structure: one plant, multi-plant, group-level operations.
- Product complexity: SKU count, BOM depth, routing variability, quality criticality.
- Customer pressure: lead time, quality, traceability, customization, compliance.

## 2. Operating Metrics

Ask for baseline where possible. If absent, mark as assumption.

| Domain | Useful metrics |
|---|---|
| Delivery | OTIF, schedule adherence, order lead time, expedite ratio |
| Production | OEE, plan attainment, throughput, WIP, report timeliness |
| Quality | FPY, defect rate, rework rate, NCR cycle time, traceability time |
| Inventory | inventory turns, stock accuracy, kitting rate, obsolete inventory |
| Equipment | downtime, MTBF, MTTR, maintenance compliance |
| Cost | unit manufacturing cost, scrap cost, overtime, energy cost |
| Data | master-data completeness, interface failure rate, manual entry count |

## 3. Process Diagnosis

Map the end-to-end flow:

- Plan: demand, MPS/MRP, APS, capacity, constraints.
- Source: supplier, incoming inspection, material availability.
- Make: work order, dispatch, routing, reporting, WIP, exception.
- Quality: inspection, SPC, NCR, CAPA, release, traceability.
- Store: receiving, putaway, kitting, picking, movement, cycle count.
- Maintain: inspection, monitoring, alarm, work order, spare parts.
- Deliver: finished goods, shipment, customer complaint, after-sales.

For each flow, note:

- handoff points
- waiting time
- rework loops
- manual data entry
- delayed status update
- owner ambiguity
- system breakpoints

## 4. System Diagnosis

List systems and responsibility boundaries:

| System | Typical responsibility |
|---|---|
| ERP | customer order, purchase, financial inventory, costing |
| PLM | product, BOM, routing, engineering change |
| APS | capacity, sequencing, finite scheduling |
| MES/MOM | work order execution, dispatch, reporting, WIP, exceptions |
| WMS | location, lot, movement, kitting, stock accuracy |
| QMS | inspection, NCR, CAPA, quality release |
| TPM/EAM | equipment, maintenance, spare parts, downtime |
| SCADA/PLC/IoT | equipment status, process data, alarms |
| BI/Data platform | KPI, analytics, cross-system insight |
| AI assistant | question answering, diagnosis, prediction, recommendation |

Check:

- duplicate data entry
- unclear system of record
- batch sync vs real-time event
- integration latency
- interface error rate
- manual Excel bridge

## 5. Data Diagnosis

Key data objects:

- product, BOM, routing, work center, equipment
- customer order, sales order, production order, operation
- material, lot/batch, serial number, location
- inspection plan, inspection result, NCR, CAPA
- downtime, alarm, maintenance order, spare part
- shipment, customer complaint, traceability chain

Check:

- owner
- source system
- update frequency
- quality problem
- missing fields
- inconsistent code
- traceability relationship

## 6. Organization Diagnosis

Identify:

- executive sponsor
- business owner by scenario
- IT owner by system
- data owner by master data
- KPI owner by metric
- plant key users
- PMO and steering cadence

Common organization gaps:

- IT owns system but business does not own process.
- No one owns cross-system master data.
- KPI exists in reports but no owner acts on exceptions.
- Plant users enter data after the fact because system does not help daily work.

## 7. IT/OT Diagnosis

Check:

- equipment connectivity coverage
- protocol: OPC UA, Modbus, MQTT, proprietary, manual upload
- data frequency and granularity
- network isolation and security boundary
- edge gateway availability
- timestamp quality
- equipment master-data mapping
- alarm and downtime reason coding

## 8. Maturity Snapshot

Use five practical levels:

1. **Manual**: paper/Excel, limited system coverage.
2. **Systemized**: core systems exist, but data stays in silos.
3. **Integrated**: key objects and events flow across systems.
4. **Data-driven**: operational KPI and exception management are active.
5. **Intelligent**: AI/optimization assists decisions under governance.

Always state evidence or assumptions behind maturity claims.
