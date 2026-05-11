## Instructions for AI Implementation Agent

You are implementing a production-ready modular SaaS starter, not a prototype-only demo.

Follow these rules:

1. Create the repository structure exactly as specified unless a better equivalent is required by the chosen framework.
2. Implement modules behind explicit manifests.
3. Never hard-code tenant-specific branding into components.
4. All public pages must resolve tenant configuration from hostname or route slug.
5. All business tables must include `tenant_id`.
6. All authenticated endpoints must enforce tenant isolation and RBAC.
7. Every feature must include:
   - migration/schema changes
   - service logic
   - API route/controller
   - UI state
   - tests
   - seed data when relevant
8. Keep vertical-specific behavior configurable. Do not fork the app for restaurants vs clinics.
9. Use adapter interfaces for external vendors.
10. Do not implement AI product features unless added as a future module.

## Output Requirements

The final implementation must include:

- runnable local dev environment
- seed tenants
- frontpage-only tenant
- restaurant tenant with booking
- clinic tenant with booking + CRM
- theme preset switcher in admin
- module enable/disable configuration
- documented environment variables
- passing unit and E2E smoke tests

## Done Means

A feature is done only when:

- the tenant can use it through the UI
- RBAC is enforced server-side
- the API is documented
- empty/loading/error states exist
- mobile layout works
- tests cover core happy path and one failure path

---

