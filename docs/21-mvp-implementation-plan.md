# MVP Implementation Plan

Status legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.

This document is the persistent checklist for the first usable MVP of MARGO. Update this file whenever a task starts or finishes so future agents can see what is already done.

## MVP Scope

The MVP must prove the product can run as a multi-tenant white-label SaaS with three demo tenants:

1. Frontpage-only restaurant tenant.
2. Restaurant tenant with frontpage + booking.
3. Clinic tenant with frontpage + booking + CRM.

Included modules:

- Platform core: tenant resolution, module registry, RBAC, theme/branding, audit/outbox foundations.
- Frontpage: branded public homepage from blocks, theme presets, basic admin page editing.
- Booking: services/resources, availability search, public booking creation, staff list/calendar-lite, cancellation token, notification outbox event.
- CRM: customers, notes, booking timeline events, clinic labels.

Excluded from MVP unless required for clean interfaces:

- Real Stripe payment capture; keep payment adapter interface and mark deposits as disabled/demo-only.
- Real email/SMS sending; use durable notification outbox and local/log adapter.
- Advanced drag-and-drop page builder.
- Reseller mode, analytics, loyalty, inventory, AI modules.

## Technical Decisions for MVP

- Use a TypeScript monorepo with `pnpm` workspaces and Turborepo-compatible layout.
- Use separate Next.js apps from the beginning: `apps/public-web` for public/frontpage/booking surfaces and `apps/admin-web` for tenant admin/CRM/operations. Do not collapse them into a single app for MVP convenience.
- Use a separate API surface under `apps/api` or shared API route handlers with clean service boundaries; if framework constraints require temporary routing in an app, keep API code in packages and preserve the split-app architecture.
- Use PostgreSQL + Prisma for schema, migrations, and seed data.
- Use Tailwind CSS and CSS variables for theme tokens.
- Use Vitest for unit/integration tests and Playwright for E2E smoke tests.
- Use simple credentials/dev auth for MVP admin only, behind an auth abstraction that can later be replaced by Auth.js/OIDC.

## Milestone 0 — Repository Bootstrap

Goal: create a runnable local development foundation.

Checklist:

- [x] Create `package.json`, `pnpm-workspace.yaml`, `turbo.json`, TypeScript base config.
- [x] Create app/package directories matching `docs/03-repository-structure.md` as closely as practical.
- [x] Add Next.js public web app shell.
- [x] Add Next.js admin web app shell.
- [x] Add shared packages: `core`, `ui`, `themes`, `modules`, `db`, `validators`, `types`.
- [x] Add Docker Compose for PostgreSQL and local services.
- [x] Add `.env.example` with required MVP variables.
- [x] Add lint, typecheck, test, build scripts.
- [x] Add CI workflow running install, lint, typecheck, tests, build.

Acceptance checks:

- [x] `pnpm install` succeeds.
- [x] `pnpm dev` starts local apps.
- [x] `pnpm test` succeeds with initial smoke tests.
- [x] `pnpm build` succeeds.

## Milestone 1 — Database Baseline and Seed Data

Goal: implement the tenant-safe data model and demo data.

Checklist:

- [x] Add Prisma schema for core tables: tenants, domains, locations, users, role_bindings, tenant_modules, tenant_branding, audit_logs, event_outbox.
- [x] Add frontpage tables: public pages and page blocks/config storage.
- [x] Add booking tables: services, resources, bookings.
- [x] Add CRM tables: customers, customer_notes, customer_tags, assignments, timeline events/custom fields if needed.
- [x] Add unique/index constraints needed for tenant isolation and booking lookups.
- [x] Add seed script for three MVP tenants.
- [x] Seed theme branding and module enablement per tenant.
- [x] Seed services/resources for restaurant and clinic demos.
- [x] Seed admin users and role bindings.

Acceptance checks:

- [x] `pnpm db:migrate` applies cleanly.
- [x] `pnpm db:seed` creates the three tenants.
- [x] Tests verify every business table includes `tenant_id` where required.

## Milestone 2 — Platform Core

Goal: every request resolves tenant context and module/RBAC constraints.

Checklist:

- [x] Implement tenant resolver: custom hostname, subdomain, `/t/:tenantSlug` development prefix.
- [x] Implement tenant context type and server helper.
- [x] Implement module manifest type and registry.
- [x] Implement module dependency validation.
- [x] Implement tenant module enable/disable checks.
- [x] Implement RBAC roles and permission map from specs.
- [x] Implement server-side permission guard for admin APIs.
- [x] Implement branded 404/403 helpers.
- [x] Implement event outbox service.
- [x] Implement audit log helper for sensitive admin actions.

Acceptance checks:

- [x] Unit tests cover tenant resolution order.
- [x] Unit tests cover module dependency validation.
- [x] Unit tests cover RBAC allowed/denied paths.
- [x] Disabled module routes return 404/403.

## Milestone 3 — Theme and Branding MVP

Goal: tenants can have distinct runtime branding without rebuilds.

Checklist:

- [x] Add five preset theme definitions from `docs/09-visual-presets.md`.
- [x] Implement theme token validation.
- [x] Implement CSS variable compiler.
- [x] Apply tenant theme to public pages.
- [x] Apply tenant theme to admin preview where relevant.
- [x] Implement admin branding/theme preset switcher.
- [x] Persist tenant theme preset and overrides.

Acceptance checks:

- [x] Unit tests cover valid/invalid theme tokens.
- [x] E2E-equivalent smoke verifies changing theme preview updates runtime CSS variables without content loss.
- [x] Basic contrast-sensitive colors are checked for presets.

## Milestone 4 — Frontpage Module MVP

Goal: publish branded public pages from configurable blocks.

Checklist:

- [x] Define frontpage module manifest with routes and permissions.
- [x] Implement public page fetch API/service.
- [x] Implement block renderer for MVP blocks: hero, service list, location/opening hours, CTA, rich text, contact form placeholder.
- [x] Implement homepage route for tenant slug/host.
- [x] Implement branded missing page.
- [x] Implement admin page list/edit/publish screens.
- [x] Implement SEO metadata fields.
- [x] Hide booking/CRM links when modules are disabled.

Acceptance checks:

- [x] Frontpage-only tenant homepage renders with no booking/CRM links.
- [x] Mobile layout smoke test passes.
- [x] Public page unit tests cover published/draft/missing page behavior.

## Milestone 5 — Booking Module MVP

Goal: customers can book, staff can manage, double booking is prevented.

Checklist:

- [x] Define booking module manifest with routes and permissions.
- [x] Implement service/resource admin CRUD APIs and minimal UI.
- [x] Implement availability engine using business hours, service duration, resource hours, existing bookings, party size/capacity where needed.
- [x] Implement public availability search API.
- [x] Implement public booking creation API with idempotency key.
- [x] Create or update customer during booking.
- [x] Prevent double booking transactionally.
- [x] Insert `booking.created` outbox event.
- [x] Insert CRM timeline event when CRM is enabled.
- [x] Implement public booking flow UI.
- [x] Implement confirmation page and manage/cancel by public token.
- [x] Implement staff bookings list/calendar-lite.
- [x] Implement staff cancel/check-in/no-show actions.

Acceptance checks:

- [x] Unit tests cover availability calculation.
- [x] Integration tests cover booking creation and double-booking prevention.
- [x] E2E-equivalent smoke: restaurant booking succeeds.
- [x] E2E-equivalent smoke: clinic booking succeeds.
- [x] Notification outbox event is queued after booking.

## Milestone 6 — CRM Module MVP

Goal: staff can manage customers and see booking history.

Checklist:

- [ ] Define CRM module manifest with routes and permissions.
- [ ] Implement customer search/list API and UI.
- [ ] Implement customer profile API and UI.
- [ ] Implement customer note create/list API and UI.
- [ ] Implement timeline query with booking and note events.
- [ ] Implement clinic labels: Patient/Patients, Appointment/Appointments.
- [ ] Implement custom field schema basics if time allows; otherwise persist as post-MVP P1 item with documented omission.

Acceptance checks:

- [ ] Staff can search customers.
- [ ] Staff can add a note.
- [ ] Booking-created timeline event appears on customer profile.
- [ ] Clinic tenant displays patient labels.

## Milestone 7 — Admin Shell and Operations MVP

Goal: tenant users can operate the MVP safely.

Checklist:

- [ ] Implement dev/admin login flow.
- [ ] Implement admin shell navigation based on enabled modules and RBAC.
- [ ] Implement `/admin/me`, `/admin/tenant`, `/admin/modules` APIs.
- [ ] Implement tenant module settings read UI.
- [ ] Implement module route guards in admin app.
- [ ] Add empty/loading/error states for core screens.
- [ ] Add responsive admin layout.

Acceptance checks:

- [ ] RBAC prevents unauthorized actions server-side.
- [ ] Module-disabled admin routes are inaccessible.
- [ ] Admin shell works on mobile viewport.

## Milestone 8 — Testing, Accessibility, and Hardening

Goal: make the MVP reliable enough for demos and iteration.

Checklist:

- [ ] Add unit test suite for core services.
- [ ] Add integration tests for tenant-isolated queries.
- [ ] Add E2E smoke suite for required MVP scenarios.
- [ ] Add accessibility checks for public homepage and booking form.
- [ ] Add form validation and accessible error messages.
- [ ] Ensure PII is not logged by app logger.
- [ ] Ensure mutation endpoints enforce CSRF or non-cookie auth constraints.
- [ ] Document local development commands.
- [ ] Document known MVP limitations.

Acceptance checks:

- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm e2e` passes locally or in CI environment.
- [ ] `pnpm build` passes.

## MVP Completion Criteria

The MVP is complete only when all of these are checked:

- [ ] Three seed tenants are available and documented.
- [ ] Public homepage works for all seed tenants.
- [ ] Frontpage-only tenant has no booking/CRM links or routes.
- [ ] Restaurant booking demo works end-to-end.
- [ ] Clinic booking + CRM demo works end-to-end.
- [ ] Tenant owner can change theme preset and preview public page.
- [ ] Staff can view bookings and customers.
- [ ] Staff can add customer notes.
- [ ] RBAC and tenant isolation are tested.
- [ ] All core commands pass: install, lint, typecheck, test, build, E2E smoke.

## How to Maintain This Plan

- Before starting a task, change its checkbox from `[ ]` to `[~]`.
- When implementation and tests pass, change `[~]` to `[x]`.
- If blocked, change to `[!]` and add a short note under the milestone.
- Do not mark tasks done based only on code existing; use the acceptance checks.
- If scope changes, update this document and the relevant spec document first.
