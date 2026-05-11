## Roles

```yaml
roles:
  platform_super_admin:
    description: Can manage all tenants and platform configuration.
  tenant_owner:
    description: Full access to one tenant.
  location_manager:
    description: Manage one or more locations.
  front_desk:
    description: Manage bookings and basic customer information.
  provider:
    description: View assigned schedule and limited customer context.
  marketing_editor:
    description: Manage public website content and assets.
  analyst:
    description: Read-only analytics and exports.
```

## Permission Examples

```yaml
permissions:
  site.pages.read: [tenant_owner, marketing_editor]
  site.pages.write: [tenant_owner, marketing_editor]
  booking.read: [tenant_owner, location_manager, front_desk, provider]
  booking.write: [tenant_owner, location_manager, front_desk]
  booking.cancel: [tenant_owner, location_manager, front_desk]
  crm.customer.read: [tenant_owner, location_manager, front_desk, provider]
  crm.customer.write: [tenant_owner, location_manager, front_desk]
  crm.note.write: [tenant_owner, location_manager, front_desk, provider]
  tenant.billing.manage: [tenant_owner]
  tenant.modules.manage: [tenant_owner]
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

## Clinic Mode Extra Controls

- More restrictive default roles.
- Hide sensitive fields from provider unless assigned.
- Disable sensitive SMS body content by default.
- Stronger audit logging.
- Export/delete workflows require owner-level permission.
- Optional tenant isolation upgrade path.

---

