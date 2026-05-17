## Rework Goal

Align MARGO with the product model of an internal webapp factory plus multi-tenant runtime platform.

The builder/studio is an internal asset. Customers receive tenant-specific public webapps and operational portals. Builder access can be delegated, but it is not the default customer-facing product.

## Phase 0: Terminology and Permission Baseline

See also `docs/22-ui-ux-refactoring-spec.md` for the design-system and builder-constraining refactor.

Deliverables:

- rename product concepts in specs and UI copy where needed:
  - Global Studio / Global Admin
  - Tenant Builder / Tenant Admin
  - Tenant Owner Portal
  - Public Webapp
- introduce canonical roles:
  - `global_admin`
  - `tenant_admin`
  - `tenant_owner`
  - `tenant_staff`
  - `provider`
  - optional delegated roles such as `marketing_editor`
- rename existing legacy roles to the new model; no compatibility layer is required before launch
- update permission constants and route guards

Exit criteria:

- global/platform permissions are impossible to obtain from tenant roles
- tenant owner does not automatically imply tenant admin
- tenant admin does not automatically imply tenant owner
- specs and UI copy use the same surface names

## Phase 1: Admin App Surface Split

Deliverables:

- keep one `apps/admin-web` codebase, with clean route/shell separation:
  - `/global-admin/*` for Global Studio
  - `/tenant/*` for Tenant Builder/Admin
  - `/owner/*` for Tenant Owner Portal
- update admin navigation to show routes based on surface and role
- add explicit forbidden/empty states when a user has tenant owner access but not builder access
- move operational pages such as bookings, quote requests, customers, and calendars toward owner/ops navigation
- keep builder pages such as theme, pages, uploads, module config, and templates under tenant builder/global studio as appropriate

Exit criteria:

- a tenant owner can see operational pages without seeing builder controls
- a tenant admin can configure public app behavior without receiving global admin rights
- a global admin can create/manage tenants and templates without being confused with a tenant owner

## Phase 2: Global Studio MVP

Deliverables:

- global admin login/role guard
- tenant list/create/archive/delete screens
- tenant creation flow from template
- module enablement at tenant creation
- template inventory screen
- theme inventory screen
- support/debug view for tenant state

Exit criteria:

- a global admin can create a tenant from a template
- a global admin can archive/delete a tenant with confirmation and audit log
- non-global users cannot access global studio APIs/routes

## Phase 3: Template System

Deliverables:

- define a versioned file-based template format first
- templates include:
  - enabled modules
  - selected theme
  - default branding placeholders
  - default pages/blocks
  - default module config
  - default services/resources where appropriate
- add template materialization service that creates tenant records deterministically
- add template export/promote-from-demo workflow
- keep demo seed snapshots separate from production templates

Exit criteria:

- demo tenants can be promoted into explicit reusable templates
- creating a new tenant from a template does not depend on stale demo DB state
- templates do not contain tenant-specific secrets

## Phase 4: Theme Studio and White-Label Theme Rules

Deliverables:

- global theme definition UI/API
- validation that themes contain only reusable visual tokens
- no logo/logotype/photos/copy in theme records
- tenant branding remains tenant-specific
- theme preview with sample neutral content

Exit criteria:

- global admin can create/edit reusable themes
- tenant admins can select themes and add branding overrides
- public webapps never show MARGO branding unless explicitly configured

## Phase 5: Tenant Owner Portal MVP

Deliverables:

- owner dashboard shell
- module-aware owner navigation
- bookings owner view
- quote requests owner view
- calendar/open days settings
- customer/guest/patient summaries where enabled
- role-specific permissions for owner/staff/provider

Exit criteria:

- tenant owner can operate the business without accessing the builder
- enabled modules define which owner pages appear
- owner mutations are tenant-scoped and audited where sensitive

## Phase 6: Builder Hardening

Deliverables:

- tenant builder only exposes configuration/building tasks
- page/theme/module editors use `tenant_admin` permissions
- module-owned public pages remain locked in page inventory
- snapshot/restore adapters cover editable demo/template state
- asset persistence and template-safe asset handling

Exit criteria:

- builder remains an internal asset by default
- delegated builder access is explicit and permission-scoped
- reseed/template workflows preserve demo configuration predictably

## Phase 7: Tenant Isolation Hardening

Deliverables:

- audit every tenant-owned table for `tenant_id` and required indexes
- audit every service/repository method for trusted tenant context
- add cross-tenant denial tests for admin, owner, public mutation, and worker paths
- tenant-scope object storage keys and upload access checks
- add lint/test helpers to prevent unscoped tenant queries where practical

Exit criteria:

- every tenant-scoped API rejects cross-tenant IDs
- workers process events only within event tenant context
- asset access cannot leak between tenants

## Phase 8: Export/Import Compatibility System

Deliverables:

- define tenant webapp export package schema with version markers
- build export service for tenant config, branding, pages, module settings, and module-owned configurable data
- build import dry-run validation
- build import materialization service
- add per-module export/import adapter contract
- add version migrator registry and old export fixtures
- add export-to-template and template-to-tenant flows

Exit criteria:

- current exports round-trip into equivalent tenants
- old fixture exports import successfully after migrators
- unknown/missing fields are handled safely and reported

## Phase 9: Persistence and Disaster Recovery

Deliverables:

- document backup/restore procedures for SaaS and self-hosted deployments
- add local backup/restore scripts for Postgres Docker volume and uploaded assets
- configure production backup expectations: retention, encryption, RPO/RTO
- add staging restore drill checklist
- add monitoring/alert requirements for failed backups
- add pre-migration backup requirement for risky releases

Exit criteria:

- local backup can be restored into a working dev stack
- production deployment docs define RPO/RTO and retention
- restore drill checklist exists and is testable

## Phase 10: Migration and Compatibility

Deliverables:

- migrate existing seeded users/role bindings to new role names
- update tests for route guards and visible navigation
- update docs and acceptance criteria
- add smoke tests for each surface

Exit criteria:

- existing demos still work
- all core commands pass
- each surface has at least one role/access test

---
