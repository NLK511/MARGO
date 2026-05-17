# Theme migration

Use `pnpm theme:migrate` to backfill theme families, versions, and tenant assignments.

## Output
- generated report: `.margo/theme-migration-report.json`
- dry-run supported
- missing presets fall back safely

## Seed behavior
Seeded demo tenants are restored from `packages/db/prisma/seed.ts` and snapshot state.
