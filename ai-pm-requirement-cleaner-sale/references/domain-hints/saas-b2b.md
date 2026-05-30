# Domain Pack: SaaS / B2B

## Applicable Keywords

Tenant, organization, role permissions, approval workflow, API, Webhook, billing, quota, SSO, audit log.

---

## Diagnostic Enhancement

Auxiliary dimensions (not included in total score):
1. `B1 Multi-tenant Clarity`: whether tenant boundaries and data isolation are clearly defined
2. `B2 Integration Readiness`: whether the integration target, method, and failure strategy are clearly defined

---

## Additional Follow-up Questions (select based on blocking items)

1. At what level should permissions be controlled (page/operation/data scope)?
2. Who defines roles: platform presets, tenant customization, or a hybrid approach?
3. Is multi-tenancy fully isolated? Are there cross-tenant sharing requirements?
4. Is the approval workflow fixed or configurable? How are delegation/timeout/rejection handled?
5. Are connected systems real-time or batch? What are the failure retry and alert strategies?

---

## PRD Extension Suggestions

Prioritize using:
1. Extension Pack A (system/page category) for permissions and workflows
2. Extension Pack B (rules/policy category) for billing, quotas, and policy triggers

Additional checklist items:
- Operation audit and retention period
- Batch operation conflict handling
- Rate limiting / degradation strategy
- Offboarding and automatic permission revocation
