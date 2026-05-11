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

Verification commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Planning

Specs live in `docs/`. MVP progress is tracked in `docs/21-mvp-implementation-plan.md`.
