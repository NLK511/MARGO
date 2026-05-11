## Recommended Monorepo

```txt
white-label-smb-platform/
  apps/
    public-web/
      app/
      components/
      routes/
      tests/
    admin-web/
      app/
      components/
      routes/
      tests/
    api/
      src/
        main.ts
        app.module.ts
        modules/
        workers/
        common/
      tests/
  packages/
    core/
      src/
        tenant/
        auth/
        rbac/
        config/
        logger/
        events/
    ui/
      src/
        components/
        primitives/
        layouts/
    themes/
      presets/
      tokens/
      src/
    modules/
      src/
        module-manifest.ts
        module-registry.ts
        contracts.ts
    integrations/
      src/
        payments/
        calendar/
        email/
        sms/
        storage/
    db/
      prisma/
      migrations/
      seed/
    validators/
      src/
    types/
      src/
  docs/
  specs/
    openapi.yaml
    events.yaml
    permissions.yaml
    theme.schema.json
    module-manifest.schema.json
  infra/
    docker-compose.yml
    Dockerfile.api
    Dockerfile.public-web
    Dockerfile.admin-web
    k8s/
    terraform/
  scripts/
    seed.ts
    create-tenant.ts
    validate-specs.ts
  .github/
    workflows/
      ci.yml
      deploy.yml
  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
```

## Naming Rules

- Use `tenant` not `organization` in platform core.
- Use `customer` as the base entity.
- Use `profile_kind` to map customer to `guest`, `patient`, `client`, or `member`.
- Use `resource` as generic term for provider/table/room/chair.
- Use `service` as generic term for appointment/reservation offering.

---

