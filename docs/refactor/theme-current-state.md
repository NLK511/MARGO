# Theme current state inventory

Current theme/runtime usage in the repo:

- Public runtime composes tenant themes from `@margo/themes` in `apps/public-web/app/frontpage.tsx` and `apps/public-web/app/tenant-branding.ts`.
- Admin theme editing uses `@margo/themes` in `apps/admin-web/app/theme-preset-switcher.tsx` and `apps/admin-web/app/admin/theme/route.ts`.
- Seed data stores legacy `themePresetId`, `themeOverrides`, and `layoutConfig` in `packages/db/prisma/seed.ts` and `packages/db/src/demo-seed-state.ts`.
- Current theme presets live in `packages/themes/src/index.ts` as reusable visual presets.
- Theme runtime output is consumed through `mergeTheme()`, `compileThemeCssVariables()`, `compileThemeStyleAttribute()`, and `createThemeRuntimeSurface()`.

Current legacy behavior to preserve during migration:

- Existing tenants still resolve by `themePresetId`.
- Branding overrides remain persisted at the tenant level.
- Public rendering still uses theme/layout runtime CSS variables.
- Demo seed snapshot restoration must continue to restore theme branding and layout data.
