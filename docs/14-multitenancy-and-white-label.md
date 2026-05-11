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

## White-Label Rules

- No platform branding on public pages unless tenant chooses.
- Emails use tenant sender identity where configured.
- Customer-facing URLs use tenant domain.
- Admin may still show platform branding unless reseller mode is enabled.

## Reseller Mode Future Support

Add reseller entity:

- owns multiple tenants
- custom admin branding
- tenant templates
- billing aggregation

---

