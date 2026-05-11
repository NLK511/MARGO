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
pnpm build
pnpm --filter @margo/db db:validate
```

## Planning

Specs live in `docs/`. MVP progress is tracked in `docs/21-mvp-implementation-plan.md`.
