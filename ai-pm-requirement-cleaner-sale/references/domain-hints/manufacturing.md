# Domain Pack: Manufacturing (MOM / MES)

## Applicable Keywords

MES, work order, production line, equipment, quality inspection, SOP, BOM, work reporting, line stoppage, OEE, batch traceability.

---

## Diagnostic Enhancement

Add two observation dimensions beyond G/S/C/R/E (auxiliary only, not included in total score):
1. `M1 Process Completeness`: whether it covers the main process + exceptions + state transitions
2. `M2 Organizational Fit`: whether the responsibility boundaries of workshop/team/role are clearly defined

---

## Additional Follow-up Questions (select from these, do not ask all at once)

1. Is this process constrained by SOPs? Which step is most likely to deviate from SOP?
2. What are the statuses for documents/tasks? Which status does a rejection return to?
3. How are line stoppages, shift handovers, network disconnections, and equipment offline situations handled?
4. Is the data source manual entry or equipment collection? What is the collection frequency?
5. Which system integrations are involved (ERP/SCADA/WMS)? How are failures compensated?

---

## PRD Extension Suggestions

It is recommended to prioritize the following after the core template:
1. Extension Pack A (system/page category)
2. Add "state transition constraints" and "equipment integration points"

Additional checklist items:
- Shift handovers
- Timeout escalation
- Audit trail
- Traceability scope and retention duration
