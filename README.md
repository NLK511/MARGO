# MARGO

MARGO is a modular, multi-tenant white-label SaaS platform for SMB websites, booking, and customer management.

## Local development

```bash
pnpm install
pnpm dev
```

Apps:

- Public web: http://localhost:3000
- Admin web: http://localhost:3001
- API placeholder: `apps/api`

Local infrastructure:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Database setup:

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d postgres
pnpm db:migrate
pnpm db:seed
```

Seed tenants:

- `bistro-frontpage` — frontpage-only restaurant
- `table-and-co` — restaurant with booking
- `oak-clinic` — clinic with booking + CRM

Verification commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
pnpm build
pnpm --filter @margo/db db:validate
```

Admin dev login:

- Open http://localhost:3001/login and choose a seed tenant.
- The dev auth cookie is intentionally simple and isolated behind an auth abstraction; replace it with Auth.js/OIDC before production.
- Module-disabled admin routes are guarded, for example CRM routes are blocked for `bistro-frontpage` and `table-and-co`.

Known MVP limitations:

- Payments, email, SMS, and calendar sync use adapter/outbox interfaces only; no real vendor calls are made.
- Admin CRUD screens are intentionally minimal and optimized for demo workflows, not full production operations.
- Availability uses MVP business-hour assumptions and does not yet support holidays, staff PTO, or complex recurrence.
- E2E smoke tests run as deterministic service-level Vitest checks in this repository; browser Playwright coverage is a post-MVP hardening item.

## Planning

Specs live in `docs/`. MVP progress is tracked in `docs/21-mvp-implementation-plan.md`.
