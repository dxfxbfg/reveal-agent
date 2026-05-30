# Manufacturing Scenario Library

Use this library to turn abstract digital transformation goals into concrete scenario closed loops.

Each scenario should include:

- trigger
- business objects
- current pain
- target closed loop
- systems involved
- data required
- KPI
- slide pattern

## 1. Production Execution Transparency

- Trigger: work order released, dispatch changed, operation started/completed.
- Objects: work order, operation, workstation, operator, WIP, routing.
- Current pain: report delay, WIP invisible, plan and actual disconnected.
- Target loop: release order -> dispatch -> execute -> report -> exception -> progress and cost update.
- Systems: ERP, MES/MOM, APS, SCADA/PLC, BI.
- Data: order, routing, operation status, output, scrap, downtime.
- KPI: plan attainment, report timeliness, WIP accuracy, throughput.
- Patterns: Process Pathway, KPI Dashboard, Data Flow.

## 2. Quality Traceability and Exception Closure

- Trigger: inspection failure, customer complaint, process deviation.
- Objects: lot/batch, serial number, inspection result, NCR, CAPA, shipment.
- Current pain: traceability depends on Excel and people; responsibility chain is unclear.
- Target loop: defect detected -> lot isolated -> NCR created -> root cause -> disposition -> CAPA -> traceability report.
- Systems: QMS, MES, WMS, ERP, traceability platform.
- Data: genealogy, inspection result, quality status, inventory status, shipment relation.
- KPI: traceability time, NCR cycle time, FPY, rework rate, complaint closure time.
- Patterns: Scenario Closed Loop, Root Cause, KPI Dashboard.

## 3. Material Kitting and Warehouse Transparency

- Trigger: production order planned or material shortage occurs.
- Objects: material, lot, location, pick list, kitting order, inventory status.
- Current pain: inventory exists in ERP but not available on shop floor; quality status and stock status conflict.
- Target loop: order demand -> availability check -> quality release -> kitting -> issue -> return -> inventory reconciliation.
- Systems: ERP, WMS, MES, QMS, barcode/RFID.
- Data: stock, lot, location, quality status, pick/issue/return record.
- KPI: kitting rate, stock accuracy, material shortage events, inventory turns.
- Patterns: Process Pathway, Comparison Matrix, KPI Dashboard.

## 4. Planning Collaboration and Constraint Scheduling

- Trigger: demand change, urgent order, material shortage, capacity conflict.
- Objects: sales order, production order, material, line, equipment, shift, constraint.
- Current pain: plan changes are not synchronized to material, production, quality, and delivery.
- Target loop: demand change -> constraint check -> schedule update -> material and shop-floor synchronization -> delivery promise update.
- Systems: ERP, APS, MES, WMS, QMS.
- Data: demand, BOM, routing, capacity, material availability, WIP, delivery date.
- KPI: schedule adherence, OTIF, expedite ratio, plan change response time.
- Patterns: Scenario Closed Loop, Decision/Trade-off, Timeline.

## 5. Equipment Maintenance and OEE Improvement

- Trigger: alarm, downtime, inspection finding, predictive signal.
- Objects: equipment, alarm, downtime, maintenance order, spare part.
- Current pain: downtime reasons are late or inaccurate; maintenance action is reactive.
- Target loop: status monitoring -> alarm classification -> maintenance order -> spare-part check -> repair -> cause coding -> OEE review.
- Systems: SCADA/PLC/IoT, TPM/EAM, MES, WMS, BI.
- Data: equipment status, alarm, downtime reason, work order, spare inventory.
- KPI: OEE, downtime, MTBF, MTTR, maintenance compliance.
- Patterns: Root Cause, KPI Dashboard, Action Board.

## 6. Process and Engineering Change Collaboration

- Trigger: engineering change, routing update, quality improvement.
- Objects: product, BOM, routing, process parameter, work instruction, change order.
- Current pain: process changes are not synchronized to MES, quality plan, and shop-floor instruction.
- Target loop: change request -> impact analysis -> approval -> BOM/routing update -> MES/QMS sync -> execution verification.
- Systems: PLM, ERP, MES, QMS.
- Data: EBOM/MBOM, routing, inspection plan, work instruction, version.
- KPI: change lead time, wrong-version incident, first-pass verification.
- Patterns: Gap Analysis, Data Flow, Action Board.

## 7. Multi-Plant Operations Cockpit

- Trigger: daily/weekly operation review or abnormal KPI.
- Objects: plant, order, production line, inventory, quality event, equipment.
- Current pain: group management sees lagging reports, not comparable real-time indicators.
- Target loop: plant data collection -> standardized KPI -> exception alert -> owner action -> review and closure.
- Systems: ERP, MES, WMS, QMS, EAM, data platform, BI.
- Data: KPI definitions, plant mapping, event data, owner/action status.
- KPI: OTIF, OEE, FPY, inventory turns, exception closure rate.
- Patterns: Executive Summary, KPI Dashboard, Action Board.

## 8. AI Manufacturing Question Answering

- Trigger: manager asks operational question in natural language.
- Objects: order, work order, lot, inventory, quality result, equipment, KPI.
- Current pain: data is spread across systems and requires manual extraction.
- Target loop: question -> intent -> data retrieval -> KPI/explanation -> drilldown -> action suggestion.
- Systems: data platform, ERP, MES, WMS, QMS, AI assistant.
- Data: governed semantic model, permission, metric definitions, lineage.
- KPI: query response time, self-service rate, report workload reduction.
- Patterns: Architecture, Benefits, KPI Dashboard.

## 9. AI Exception Diagnosis

- Trigger: delivery risk, quality abnormality, equipment downtime, material shortage.
- Objects: exception, cause candidate, related order/lot/equipment/material.
- Current pain: root cause analysis is slow and depends on senior experts.
- Target loop: abnormal signal -> related data retrieval -> cause hypothesis -> evidence ranking -> human confirmation -> action.
- Systems: data platform, MES, WMS, QMS, EAM, AI assistant.
- Data: event history, process parameters, quality result, maintenance record, material genealogy.
- KPI: diagnosis time, repeated abnormality rate, expert workload.
- Patterns: Root Cause, Decision/Trade-off, Action Board.

## 10. AI Scheduling Assistance

- Trigger: urgent order, material shortage, capacity bottleneck, equipment downtime.
- Objects: order, operation, equipment, material, constraint, schedule.
- Current pain: schedule decisions are hard to explain and update slowly.
- Target loop: constraint change -> schedule simulation -> scenario comparison -> planner approval -> execution release.
- Systems: APS, ERP, MES, WMS, AI/optimization engine.
- Data: capacity, routing, WIP, material availability, due date, constraint rules.
- KPI: schedule stability, OTIF, change response time, planner workload.
- Patterns: Decision/Trade-off, Comparison Matrix, Timeline.
