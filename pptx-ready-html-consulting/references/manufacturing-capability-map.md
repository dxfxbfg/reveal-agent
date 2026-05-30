# Manufacturing Capability Map

Use this reference to define system responsibility boundaries. Do not present it as a product module list; use it to explain which operational capability each system owns.

## Capability Boundaries

| Domain | Owns | Typical systems |
|---|---|---|
| Demand and order | customer order, delivery promise, commercial terms | ERP, CRM |
| Product and process definition | product, BOM, routing, work instruction, engineering change | PLM, ERP, MES |
| Planning and scheduling | MPS/MRP, finite schedule, capacity constraint, sequence | ERP, APS |
| Production execution | work order, dispatch, operation, WIP, report, exception | MES/MOM |
| Warehouse and material flow | location, lot, receiving, kitting, picking, issue, return | WMS, ERP |
| Quality management | inspection, NCR, CAPA, release, traceability, complaint | QMS, MES |
| Equipment and maintenance | asset, alarm, downtime, maintenance, spare part | TPM/EAM, SCADA, IoT |
| Shop-floor data | equipment signal, process parameter, status, alarm | PLC, SCADA, IoT gateway |
| Data and analytics | metric, semantic model, cross-system analysis, lineage | data platform, BI |
| AI and optimization | question answering, diagnosis, prediction, recommendation, simulation | AI assistant, optimizer, data platform |

## Canonical Objects

Use these objects in architecture and data-flow slides:

- customer order
- sales order
- production order
- work order
- operation
- product
- BOM
- routing
- material
- lot/batch
- serial number
- location
- inspection result
- NCR/CAPA
- equipment
- alarm
- downtime
- shipment
- KPI

## Common Boundary Problems

| Problem | Better framing |
|---|---|
| ERP and MES both manage production status | Define ERP as planning/financial record, MES as execution record |
| Inventory exists but cannot be used | Separate financial stock, physical location, and quality availability |
| QMS decides quality but WMS still releases material | Define quality status as a cross-system control object |
| APS schedule is not followed by shop floor | Define schedule release and execution feedback event |
| Equipment data is collected but not used | Link equipment status to downtime reason, maintenance order, and OEE |
| AI answers conflict with reports | Govern KPI formula, semantic model, permission, and data lineage |

## Capability-to-Slide Mapping

- Use **Capability Boundary** when the audience argues about system ownership.
- Use **Architecture** when the audience needs a complete target system view.
- Use **Data Flow** when the deck needs to explain object handoff.
- Use **Scenario Closed Loop** when a capability should be shown in business action.

## AI Capability Guardrail

AI functions should always name:

- scenario
- data prerequisite
- recommended action
- human decision boundary
- audit trail

Avoid writing "AI empowers production" without a concrete object and decision.
