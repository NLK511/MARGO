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
- Global Studio, Tenant Builder, Tenant Owner Portal, and Public Webapp access rules are distinct and tested.
- Tenant owner access does not imply builder access.
- Tenant admin access does not imply global studio access.
- Cross-tenant data access is denied for every tenant-scoped API and background workflow.
- Tenant webapps can be exported and imported with versioned compatibility handling.
- Backup and restore procedures exist for persisted data and uploaded assets.

## Frontpage Acceptance Criteria

Given a tenant with only frontpage enabled,
When a visitor opens the locale homepage,
Then the branded homepage renders without booking or CRM links.

Given a tenant admin changes theme preset,
When they save and preview,
Then the public page updates without content loss.

Given a tenant admin switches the homepage layout preset between classic and editorial,
When they save and preview,
Then the content blocks remain intact and the presentation changes.

Given a tenant admin edits a page block,
When they choose a block type from the registry,
Then only the bounded core block types are offered and each block shows a short intended-usage hint.

Given a tenant admin updates branding settings such as logo, logotype, fonts, and background images,
When they save and preview,
Then the public page reflects those optional settings without requiring code changes.

Given a tenant admin adds an image block, carousel block, or split-media block,
When they save and preview,
Then the block renders on the public page with its linked buttons only where configured, uploaded or linked media, and overlay text where configured.

Given a cover image block uses the tenant block margin,
When the page renders,
Then the image remains full-bleed and overlay text and buttons keep the configured gutter.

Given overlay texts share the same slot in a block,
When the page renders,
Then the texts stack on new lines instead of overlapping.

Given a tenant admin overrides block typography or spacing,
When they save and preview,
Then the block uses the selected font, color, numeric font size, text alignment, margins, padding, and interline values.

Given branding-level typography or spacing defaults exist,
When a block does not override them,
Then the block inherits those defaults.

Given the tenant branding editor groups are collapsible,
When the admin opens the branding page,
Then the sections can be expanded or minimized to reduce clutter.

Given the branding block spacing controls are shown,
When the admin edits them,
Then the margin size can be selected explicitly.

Given menu item spacing rules are configured,
When the tenant saves branding settings,
Then the public navigation uses the configured gap between menu items.

## Tenant Isolation Acceptance Criteria

Given an authenticated user belongs to tenant A,
When they submit a tenant B identifier to any tenant-scoped API,
Then the request is denied and tenant B data is not disclosed.

Given a background worker processes a tenant-scoped event,
When it loads related records,
Then it uses the event tenant context and cannot cross into another tenant.

Given uploaded assets are stored,
When one tenant references assets,
Then another tenant cannot enumerate or use private tenant assets.

## Export/Import Acceptance Criteria

Given a tenant webapp is exported,
When the export is imported into a new tenant on the same app version,
Then the public webapp configuration is recreated with equivalent pages, branding, modules, and configurable module data.

Given an old export file is imported on a newer app version,
When compatible migrators exist,
Then the import succeeds with safe defaults for new fields and a migration report.

Given an export contains unknown fields,
When the import runs,
Then safe unknown fields are preserved or reported rather than silently discarded.

## Disaster Recovery Acceptance Criteria

Given production data is persisted,
When a backup job runs,
Then database and asset backups complete or alert on failure.

Given a restore procedure is executed in staging,
When the restored app starts,
Then tenant public webapps and owner/admin data are usable.

## Surface Acceptance Criteria

Given a global admin opens the Global Studio,
When they manage tenants, templates, or global themes,
Then those actions are allowed and audited.

Given a tenant owner opens the Tenant Owner Portal,
When they view bookings, quote requests, calendars, or operational dashboards,
Then they can operate enabled modules without seeing builder controls.

Given a tenant admin opens the Tenant Builder,
When they edit pages, branding, or module settings,
Then changes affect the public webapp but do not grant global platform permissions.

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

