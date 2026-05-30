# Architecture Patterns

Use this reference when the deck needs system, data, IT/OT, or AI architecture. Keep all diagrams PPTX-friendly: HTML/CSS boxes, text arrows, solid colors, no complex SVG/canvas.

## 1. ISA-95 Layered Architecture

Use when explaining enterprise-to-shop-floor responsibility.

Layers:

1. Enterprise planning: ERP, PLM, CRM, finance.
2. Manufacturing operations: MES/MOM, WMS, QMS, APS, TPM/EAM.
3. Supervisory/control: SCADA, DCS, HMI.
4. Control/device: PLC, CNC, robots, sensors.
5. Physical process: line, cell, machine, workstation.

PPTX-friendly layout:

- 4-5 horizontal bands.
- Each band has 3-6 modules.
- Use text arrows naming the event/object: `work order`, `quality status`, `equipment alarm`.

## 2. MOM Platform Architecture

Use when the proposal centers on manufacturing operations management.

Layers:

- interaction layer: cockpit, mobile app, workshop terminal, AI assistant
- application layer: production, quality, warehouse, equipment, planning
- orchestration layer: workflow, rule engine, event bus, approval
- data layer: master data, operational data, genealogy, KPI
- integration layer: ERP/PLM/SCADA/API/message

Risk note:

- Do not make "platform" a vague box. Name the operational mechanism it changes.

## 3. Event-Driven Integration

Use when the current problem is delayed sync or point-to-point interfaces.

Core events:

- order released
- plan changed
- material shortage
- quality failed
- lot released/frozen
- equipment alarm
- operation completed

PPTX-friendly layout:

- left: source systems
- middle: event bus / integration service
- right: consuming systems
- bottom: audit, retry, exception handling

## 4. Master Data Governance Architecture

Use when inconsistent data is the root cause.

Objects:

- material
- BOM
- routing
- work center
- equipment
- supplier
- customer
- inspection item
- defect code

Show:

- system of record
- owner
- approval flow
- downstream consumers
- quality checks

## 5. Industrial Data Platform

Use when cross-system analytics or AI is in scope.

Layers:

- source systems: ERP, MES, WMS, QMS, EAM, SCADA
- ingestion: API, CDC, message, batch, gateway
- storage/model: lakehouse, time-series, graph, semantic layer
- governance: catalog, quality, lineage, permission
- consumption: BI, AI assistant, optimization, alerts

Warn:

- A data platform without metric ownership becomes another data silo.

## 6. AI Application Architecture

Use when the deck includes AI question answering, diagnosis, prediction, or recommendation.

Required blocks:

- business user / role
- governed semantic model
- retrieval/data access
- model / reasoning / optimization
- tool or system action
- human approval for write actions
- audit and feedback

PPTX-friendly layout:

- horizontal flow with 5-7 boxes.
- bottom row for guardrails: permission, confidence, approval, trace.

## 7. Multi-Plant Rollout Architecture

Use for group-level transformation.

Pattern:

- group template: process, data, KPI, system configuration
- plant-specific adapter: equipment, local process, language, regulation
- rollout factory: assessment, fit-gap, migration, training, hypercare

Show:

- what is standardized
- what can vary
- what acceptance criteria must be met before rollout

## 8. IT/OT Security Boundary

Use when equipment connectivity or industrial network is in scope.

Show:

- enterprise network
- DMZ / edge gateway
- industrial network
- control devices
- data direction and security controls

Avoid:

- direct cloud-to-PLC lines unless the architecture is explicitly approved.
