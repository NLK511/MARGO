## Global Acceptance Criteria

- All apps build successfully.
- All tests pass.
- Seed data creates at least three tenants:
  - frontpage-only restaurant
  - restaurant with booking
  - clinic with booking + CRM
- Tenant branding works by hostname or slug.
- Module-disabled routes are inaccessible.
- RBAC prevents unauthorized actions.
- Mobile layouts work.
- Theme presets render all core screens.

## Frontpage Acceptance Criteria

Given a tenant with only frontpage enabled,
When a visitor opens the homepage,
Then the branded homepage renders without booking or CRM links.

Given a tenant owner changes theme preset,
When they save and preview,
Then the public page updates without content loss.

## Booking Acceptance Criteria

Given a service and available resource exist,
When a customer selects a slot and submits valid details,
Then a confirmed booking is created and a confirmation event is queued.

Given two customers attempt the same exclusive slot,
When both submit,
Then only one booking succeeds.

## CRM Acceptance Criteria

Given CRM is enabled,
When a booking is created,
Then the customer profile is created or updated and timeline contains the booking event.

Given a front desk user adds a note,
When the customer profile is opened,
Then the note appears with author and timestamp.

---

