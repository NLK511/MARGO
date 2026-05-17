## Role Model

MARGO separates platform-building access from tenant operations access.

```yaml
roles:
  global_admin:
    description: Platform creator/operator only. Can manage tenants, global themes, templates, and platform configuration. Not assignable to customers in the current product model.
  tenant_admin:
    description: Can configure/build one tenant webapp, including branding, pages, module settings, and public app behavior.
  tenant_owner:
    description: Business owner/operator. Can view and manage owner-facing operational data for one tenant.
  tenant_staff:
    description: Staff/front-desk role for day-to-day operations.
  provider:
    description: Service provider/clinician/server/resource owner with limited assigned-work access.
  marketing_editor:
    description: Optional delegated content role for public pages and assets without full module/admin access.
  analyst:
    description: Read-only analytics and exports.
```

Legacy role names should be renamed rather than compatibility-mapped because there are no production customers yet.

## Surface Access Rules

- Global Studio routes require `global_admin`, currently reserved for the platform creator/operator only.
- Tenant Builder/Admin routes require `tenant_admin` or a narrower delegated role such as `marketing_editor`.
- Tenant Owner Portal routes require `tenant_owner` or operational delegated roles.
- Public Webapp routes do not require login unless a module explicitly adds a customer-auth flow.
- Tenant owner and tenant admin are separate roles; neither should imply the other by default.

## Permission Examples

```yaml
permissions:
  platform.tenants.read: [global_admin]
  platform.tenants.write: [global_admin]
  platform.templates.manage: [global_admin]
  platform.themes.manage: [global_admin]

  tenant.builder.read: [tenant_admin, marketing_editor]
  tenant.builder.write: [tenant_admin]
  site.pages.read: [tenant_admin, marketing_editor]
  site.pages.write: [tenant_admin, marketing_editor]
  tenant.branding.write: [tenant_admin]
  tenant.modules.manage: [tenant_admin]

  owner.dashboard.read: [tenant_owner]
  owner.calendar.write: [tenant_owner]
  booking.read: [tenant_owner, tenant_staff, provider]
  booking.write: [tenant_owner, tenant_staff]
  booking.cancel: [tenant_owner, tenant_staff]
  quote.request.read: [tenant_owner, tenant_staff]
  quote.request.write: [tenant_admin]
  crm.customer.read: [tenant_owner, tenant_staff, provider]
  crm.customer.write: [tenant_owner, tenant_staff]
  crm.note.write: [tenant_owner, tenant_staff, provider]
```

## Security Requirements

- HTTPS only.
- Secure cookies.
- CSRF protection for cookie-authenticated mutations.
- RBAC checked server-side.
- Tenant isolation checked in every service.
- Audit sensitive operations.
- Do not put sensitive personal data in URLs.
- Redact PII/PHI from logs.
- Webhooks must verify signatures.
- Idempotency required for booking/payment mutation endpoints.
- Global Studio permissions must never be inferred from tenant-level roles.

## Clinic Mode Extra Controls

- More restrictive default roles.
- Hide sensitive fields from provider unless assigned.
- Disable sensitive SMS body content by default.
- Stronger audit logging.
- Export/delete workflows require owner-level permission.
- Optional tenant isolation upgrade path.

---
