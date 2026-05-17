## Deployment Modes

### SaaS Mode

```txt
public-web  -> Vercel/Cloud Run
admin-web   -> Vercel/Cloud Run
api         -> Cloud Run/Fly.io/Fargate
worker      -> Cloud Run/Fly.io/Fargate / background job runner
postgres    -> managed PostgreSQL
redis/queue -> managed Redis or queue service
storage     -> S3-compatible object storage
```

### Self-Hosted Mode

```txt
Docker Compose:
  public-web
  admin-web
  api
  worker
  postgres
  redis
  object-storage
```

Local one-click commands:
- `pnpm deploy` boots the stack, creates `.env` from `.env.example` when needed, runs migrations/seeds, and starts services
- `pnpm start` restarts the stack
- `pnpm stop` shuts it down
- run these commands as your normal user; the scripts will sudo only the docker calls if your Docker socket requires it

Persistence:
- Postgres data lives in the named Docker volume `postgres-data`
- local demo edits are snapshotted in `.margo/demo-seed-state.json` and restored by `pnpm db:seed`
- uploaded assets must live in persistent object storage or a backed-up persistent volume
- production tenant exports/backups must be stored outside the primary database volume

## Disaster Recovery Requirements

MARGO must support safe persistence and recovery for customer business data.

Minimum requirements:

- automated PostgreSQL backups
- point-in-time recovery where the database provider supports it
- object storage backup/versioning for uploaded assets
- documented restore procedure for full platform restore
- documented restore procedure for a single tenant where feasible
- periodic restore drills in staging
- backup retention policy per deployment mode
- encrypted backups for production data
- monitoring/alerts for failed backups
- pre-migration backup or snapshot for risky releases

Initial production recovery target:

- RPO: maximum 24 hours of data loss
- RTO: restore service within 4–8 hours using documented manual restore

These targets can be tightened when revenue/usage justifies managed point-in-time recovery and automated failover.

Local/self-hosted mode must document how to back up and restore Docker volumes and asset storage.

Default early-stage strategy:

- `pnpm backup` creates a local/self-hosted backup of PostgreSQL and uploaded assets
- `pnpm restore -- <backup-dir>` restores a local/self-hosted backup
- daily automated database backups
- persistent object storage or backed-up asset volume
- manual restore runbook
- staging restore drill before major releases

## Environment Variables

```env
DATABASE_URL=
REDIS_URL=
APP_BASE_URL=
ADMIN_BASE_URL=
PUBLIC_WEB_BASE_URL=
AUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EMAIL_PROVIDER=log|resend|postmark
EMAIL_API_KEY=
EMAIL_FROM=
NOTIFICATION_WORKER_INTERVAL_MS=5000
NOTIFICATION_WORKER_BATCH_SIZE=20
SMS_PROVIDER=
SMS_API_KEY=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
```

## CI Pipeline

Steps:

1. Install dependencies.
2. Typecheck.
3. Lint.
4. Validate specs.
5. Run unit tests.
6. Run DB migration check.
7. Build apps.
8. Run E2E smoke tests.
9. Build Docker images.
10. Deploy to staging.
11. Run staging smoke tests.

## Release Rules

- Migrations must be backward-compatible.
- Feature flags for risky changes.
- Rollback procedure documented for every release.
- Seed/demo tenants refreshed in staging.

---

