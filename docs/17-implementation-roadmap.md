## Phase 0: Project Bootstrap

Duration: 1 week

Deliverables:

- monorepo
- apps/packages structure
- CI pipeline
- local Docker Compose
- database schema baseline
- seed script

Exit criteria:

- app runs locally
- tests run in CI
- seed tenant loads

## Phase 1: Platform Core

Duration: 2 weeks

Deliverables:

- tenant resolver
- module registry
- RBAC foundation
- branding/theme storage
- admin shell
- public shell

Exit criteria:

- tenant context works
- module flags hide/show routes
- admin login works

## Phase 2: Frontpage Module

Duration: 2 weeks

Deliverables:

- page model
- block renderer
- basic admin page editor
- asset support
- SEO metadata
- five preset themes wired to UI

Exit criteria:

- publish branded homepage
- switch presets live
- frontpage-only package works

## Phase 3: Booking Module

Duration: 3 weeks

Deliverables:

- services/resources
- availability engine
- public booking flow
- staff booking calendar/list
- cancellation/reschedule tokens
- notification events

Exit criteria:

- restaurant and clinic booking demos work
- double booking prevented

## Phase 4: CRM Module

Duration: 2 weeks

Deliverables:

- customer profiles
- notes/tags
- timeline
- custom fields
- CSV import/export basics

Exit criteria:

- booking creates/updates customer
- timeline shows events

## Phase 5: Integrations

Duration: 2 weeks

Deliverables:

- Stripe adapter
- email adapter
- SMS adapter interface
- calendar adapter interface
- webhook handling

Exit criteria:

- deposit booking works
- confirmation email sent
- webhook deduplication works

## Phase 6: Hardening and Launch

Duration: 2–4 weeks

Deliverables:

- accessibility pass
- responsive polish
- audit logs
- observability
- production deployment
- backup/restore docs
- security review

Exit critea:

- staging tenant demos pass
- production deployment checklist complete

---

