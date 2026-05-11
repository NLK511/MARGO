## Deployment Modes

### SaaS Mode

```txt
public-web  -> Vercel/Cloud Run
admin-web   -> Vercel/Cloud Run
api         -> Cloud Run/Fly.io/Fargate
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
EMAIL_PROVIDER=
EMAIL_API_KEY=
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

