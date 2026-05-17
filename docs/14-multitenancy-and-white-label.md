## Tenant Surfaces

Each tenant can expose multiple surfaces with different access rules:

- Public Webapp: customer-facing, public by default.
- Tenant Builder/Admin: authenticated configuration/build surface.
- Tenant Owner Portal: authenticated operational surface for owners/staff.

The Global Studio is platform-scoped, not tenant-owned, and manages tenants/templates/themes globally.

## Tenant Resolution

Resolution order:

1. Exact custom domain match.
2. Subdomain match.
3. Development route prefix: `/t/:tenantSlug`.

## Tenant Config Example

```json
{
  "tenantId": "ten_oakclinic",
  "slug": "oak-clinic",
  "displayName": "Oak Clinic",
  "enabledModules": ["frontpage", "booking", "crm", "notifications"],
  "locale": "en-GB",
  "timezone": "Europe/Paris",
  "currency": "EUR",
  "branding": {
    "themePresetId": "clinical-calm",
    "logoUrl": "https://cdn.example.com/oak/logo.svg",
    "layoutConfig": {
      "nav": "top",
      "hero": "split-image"
    }
  },
  "verticalLabels": {
    "customer": "Patient",
    "customers": "Patients",
    "booking": "Appointment",
    "bookings": "Appointments",
    "resource": "Provider",
    "service": "Treatment"
  }
}
```

## Tenant Isolation Requirements

Tenant isolation is a hard product and security requirement.

- Every tenant-owned business record must carry `tenant_id`, unless it is explicitly global platform data.
- Every service/repository query must receive tenant context from trusted server-side resolution, not from untrusted client input.
- RBAC checks must include both role permission and tenant scope.
- Public routes must resolve tenant from hostname/subdomain/development prefix and must not leak data from another tenant.
- Admin, owner, and staff routes must reject cross-tenant identifiers even when the user is authenticated.
- Background jobs, outbox events, exports, imports, uploads, and notifications must carry tenant context explicitly.
- Object storage keys must be tenant-scoped.
- Tests must include cross-tenant denial cases for every new module.

## Tenant Webapp Export/Import Contract

A tenant webapp must be serializable as a portable package so it can be exported, archived, imported, cloned, or converted into a template.

Export packages should include configuration/state needed to recreate the webapp experience:

- export format version
- source platform/app version
- tenant metadata needed for reconstruction
- enabled modules and module config
- selected theme reference or embedded theme tokens
- tenant branding references and assets manifest
- public pages and page blocks
- module-owned configurable data such as services, resources, quote forms, calendar rules, and notification templates
- compatibility notes and migration history

Default exports include configuration/webapp structure only. Operational business data may be added later as an explicit encrypted export mode.

Export packages should not include by default:

- secrets or API keys
- audit logs
- event outbox history
- cache/derived data
- runtime logs
- sensitive transactional data unless explicitly requested and encrypted

Import must be version tolerant:

- every export includes a schema/version marker
- importers must run migration steps from old export versions to the current model
- unknown fields should be preserved where safe and reported, not silently discarded
- missing fields should receive safe defaults
- modules must own their own export/import migrators
- imports should support dry-run validation before writing tenant data
- imports should be idempotent where practical

Demo snapshots are local development overlays. Templates and production exports are explicit artifacts and must not depend on accidental database state.

## Demo Seed Snapshot Contract

- Baseline seed data is the source of truth for new demo tenants.
- Admin-edited demo state is snapshotted per tenant and reapplied on reseed.
- Module enablement and module config stored in `tenant_modules` are snapshotted automatically.
- Module-owned data living outside `tenant_modules` must register a snapshot adapter to participate.
- Transactional/runtime data and secrets are not part of the demo snapshot by default.

## Templates, Themes, and Branding

- Templates are reusable tenant starters: modules, pages, default theme, and default module configuration.
- Themes are reusable white-label visual presets and must not include tenant logos, photos, or copy.
- Branding is tenant-specific identity: logo, favicon, images, copy, and tenant overrides.
- Demo tenants may be promoted into templates, but templates should become explicit artifacts.

## White-Label Rules

- No platform branding on public pages unless tenant chooses.
- Emails use tenant sender identity where configured.
- Customer-facing URLs use tenant domain.
- Branding editor sections may be collapsible to keep complex tenant configuration usable.
- Tenant navigation can define item spacing rules without affecting other tenants.
- Admin may still show platform branding unless reseller mode is enabled.

## Reseller Mode Future Support

Add reseller entity:

- owns multiple tenants
- custom admin branding
- tenant templates
- billing aggregation

---

