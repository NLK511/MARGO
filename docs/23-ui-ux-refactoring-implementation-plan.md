# MARGO UI / UX Refactoring Implementation Plan

**Document purpose:** Concrete execution checklist for implementing the MARGO UI/UX refactor described in `docs/22-ui-ux-refactoring-spec.md`.

**Execution style:** Complete one milestone at a time. Do not mark a task complete unless implementation and tests both pass.

---

## 0. Operating rules for the AI implementer

- Use the requirement IDs from the specification document.
- Every new capability must include tests in the same PR or commit batch.
- Do not remove existing tenant rendering without a compatibility layer.
- Do not expose raw low-level controls to tenant users in standard mode.
- Do not mutate published themes in place.
- Prefer small, verifiable steps over large rewrites.
- Preserve existing MVP flows while migrating the theme/builder architecture.

---

## 1. Milestone overview

| Milestone | Goal | Primary requirement groups |
|---|---|---|
| M0 | Baseline audit and safety net | Current behavior capture |
| M1 | Create `packages/design` | REQ-PHIL, REQ-DS |
| M2 | Refactor theme domain model | REQ-THEME |
| M3 | Add validators and publish gates | REQ-LINT |
| M4 | Build Global Theme Studio | REQ-THEME, REQ-SEC |
| M5 | Simplify Tenant Builder | REQ-TB |
| M6 | Refactor block governance | REQ-BLOCK |
| M7 | Add visual regression and accessibility CI | REQ-VIS, REQ-LINT-005 |
| M8 | Migrate existing presets and tenant data | REQ-MIG |
| M9 | Performance, docs, and final hardening | REQ-PERF, REQ-DOC |

---

# M0 — Baseline audit and safety net

## Goal

Capture current behavior before refactoring so the new system can preserve working MVP flows while improving design architecture.

## Tasks

- [ ] **M0-T001: Inventory current theme usage**
  - Search for imports from `@margo/themes`.
  - Identify all places using `themePresets`, `compileThemeCssVariables`, `compileThemeStyleAttribute`, `createThemeRuntimeSurface`, and `mergeTheme`.
  - Output notes to `docs/refactor/theme-current-state.md`.
  - Tests: none required, documentation task.

- [ ] **M0-T002: Inventory tenant builder controls**
  - Identify all low-level visual controls in `apps/admin-web/app/theme-preset-switcher.tsx` and page editor client components.
  - Categorize each as `move-to-theme-studio`, `replace-with-token`, `remove`, or `keep-for-content`.
  - Output notes to `docs/refactor/builder-control-inventory.md`.
  - Tests: none required, documentation task.

- [ ] **M0-T003: Add baseline smoke tests for current seeded tenants**
  - Ensure public homepage renders for all seeded tenants.
  - Ensure current admin login and builder routes still work before refactor.
  - Suggested files:
    - `tests/e2e/current-mvp-baseline.test.ts`
  - Requirements covered: REQ-MIG-001.

- [ ] **M0-T004: Add baseline screenshots for current public pages**
  - Add Playwright if not already installed.
  - Capture baseline screenshots for seeded tenant homepages.
  - Suggested files:
    - `tests/visual/baseline-public-pages.spec.ts`
  - Requirements covered: REQ-VIS-001, REQ-VIS-002.

## Exit criteria

- [ ] Current tenant rendering is documented.
- [ ] Current low-level controls are documented.
- [ ] Baseline smoke tests pass.
- [ ] Baseline screenshots exist.

---

# M1 — Create `packages/design`

## Goal

Move universal design rules, tokens, doctrine, recipes, and validators into a dedicated package.

## Tasks

- [ ] **M1-T001: Create package scaffold**
  - Add `packages/design/package.json`.
  - Add `packages/design/tsconfig.json`.
  - Add exports from `packages/design/src/index.ts`.
  - Update `pnpm-workspace.yaml` only if needed.
  - Add build, lint, typecheck, and test scripts.
  - Requirements covered: REQ-DS-001 through REQ-DS-011.
  - Tests:
    - Package builds.
    - Package typechecks.

- [ ] **M1-T002: Implement doctrine constants**
  - File: `packages/design/src/doctrine.ts`.
  - Export doctrine IDs and descriptions.
  - Requirements covered: REQ-PHIL-001.
  - Tests:
    - `packages/design/src/doctrine.test.ts`.

- [ ] **M1-T003: Implement spacing tokens**
  - File: `packages/design/src/tokens/space.ts`.
  - Add resolver and validator.
  - Requirements covered: REQ-DS-001.
  - Tests:
    - Required tokens exist.
    - Resolver returns expected values.
    - Invalid token fails.

- [ ] **M1-T004: Implement typography tokens and roles**
  - File: `packages/design/src/tokens/typography.ts`.
  - Include type scale, font roles, and role validation.
  - Requirements covered: REQ-DS-002, REQ-DS-003, REQ-DS-004.
  - Tests:
    - Required type tokens exist.
    - Required roles exist.
    - Invalid role config fails.

- [ ] **M1-T005: Implement HSL color model and semantic colors**
  - Files:
    - `packages/design/src/tokens/color.ts`
    - `packages/design/src/validators/contrast.ts`
  - Add HSL ramp generator.
  - Add contrast utility.
  - Requirements covered: REQ-DS-005, REQ-DS-006, REQ-DS-007.
  - Tests:
    - HSL ramp generation.
    - Semantic token compilation.
    - Contrast pass/fail cases.
    - Grey-on-colored-surface validation.

- [ ] **M1-T006: Implement radius, elevation, motion, border, opacity, z-index tokens**
  - Files:
    - `tokens/radius.ts`
    - `tokens/elevation.ts`
    - `tokens/motion.ts`
    - `tokens/border.ts`
    - `tokens/opacity.ts`
    - `tokens/z-index.ts`
  - Requirements covered: REQ-DS-008, REQ-DS-009, REQ-DS-010.
  - Tests:
    - Token existence.
    - Invalid raw shadow fails.
    - Radius personality mapping.
    - Reduced-motion helpers.

- [ ] **M1-T007: Implement CSS variable compiler**
  - File: `packages/design/src/css/compile-design-vars.ts`.
  - Compile semantic tokens into stable CSS variables.
  - Requirements covered: REQ-DS-011.
  - Tests:
    - Snapshot compiled CSS vars.
    - Invalid recipe fails before compile.

## Exit criteria

- [ ] `@margo/design` builds, lints, typechecks, and tests.
- [ ] All REQ-DS token tests pass.
- [ ] No app code depends on it yet except optional test imports.

---

# M2 — Refactor theme domain model

## Goal

Convert existing theme presets into versioned theme families and recipes while preserving legacy behavior.

## Tasks

- [ ] **M2-T001: Create theme family and version types**
  - Files:
    - `packages/themes/src/theme-family.ts`
    - `packages/themes/src/theme-version.ts`
  - Requirements covered: REQ-THEME-001, REQ-THEME-002, REQ-THEME-003.
  - Tests:
    - ThemeFamily validation.
    - Lifecycle transition validation.
    - Published theme immutability.

- [ ] **M2-T002: Create theme recipe type and validator**
  - File: `packages/themes/src/theme-recipe.ts`.
  - Use `@margo/design` tokens and semantics.
  - Requirements covered: REQ-THEME-004.
  - Tests:
    - Missing recipe fields fail.
    - Complete recipe passes.

- [ ] **M2-T003: Migrate built-in presets to theme families**
  - Create built-in theme families for:
    - Clinical Calm
    - Editorial Bistro
    - Organic Wellness
    - Neo-Brutalist Local
    - Luxury Dark Dining
  - Files:
    - `packages/themes/src/built-ins/*.ts`
  - Requirements covered: REQ-THEME-005, REQ-MIG-001.
  - Tests:
    - All old IDs map to new IDs.
    - Built-ins validate.
    - Built-ins compile.

- [ ] **M2-T004: Add legacy compatibility mapping**
  - File: `packages/themes/src/theme-migration.ts`.
  - Map `themePresetId` to new ThemeFamily/ThemeVersion.
  - Convert legacy overrides to nearest tokens where possible.
  - Requirements covered: REQ-MIG-001, REQ-MIG-002.
  - Tests:
    - Legacy preset ID resolves.
    - Legacy spacing maps to token or warning.
    - Legacy font size maps to token or warning.

- [ ] **M2-T005: Refactor runtime compiler**
  - File: `packages/themes/src/theme-runtime.ts`.
  - Public API should expose `resolveRuntimeTheme` and `compileRuntimeThemeVars`.
  - Requirements covered: REQ-DS-011, REQ-MIG-003, REQ-PERF-001.
  - Tests:
    - Missing theme falls back.
    - Runtime output is deterministic.
    - Compatibility themes render.

## Exit criteria

- [ ] Existing public rendering can resolve old tenant themes through compatibility layer.
- [ ] Built-in themes validate through new recipe model.
- [ ] All theme lifecycle tests pass.

---

# M3 — Add validators and publish gates

## Goal

Implement design linting and integrate it into theme and page publish flows.

## Tasks

- [x] **M3-T001: Implement structured issue model**
  - File: `packages/design/src/validators/issues.ts`.
  - Include `code`, `severity`, `message`, `path`, `suggestedFix`.
  - Requirements covered: REQ-LINT-001.
  - Tests:
    - Issue object schema validation.

- [x] **M3-T002: Implement token usage validator**
  - File: `packages/design/src/validators/token-usage.ts`.
  - Requirements covered: REQ-LINT-002.
  - Tests:
    - Raw font size fails.
    - Raw spacing fails.
    - Token refs pass.

- [x] **M3-T003: Implement page composition validator**
  - File: `packages/design/src/validators/page-composition.ts`.
  - Requirements covered: REQ-LINT-003.
  - Tests:
    - Duplicate hero fails.
    - Missing CTA fails for landing page.
    - Invalid section order fails/warns.

- [x] **M3-T004: Implement visual hierarchy validator**
  - File: `packages/design/src/validators/hierarchy.ts`.
  - Requirements covered: REQ-LINT-004.
  - Tests:
    - Equal emphasis headline/body fails.
    - Multiple primary buttons fail.
    - Missing primary element fails.

- [x] **M3-T005: Implement accessibility validator**
  - File: `packages/design/src/validators/accessibility.ts`.
  - Requirements covered: REQ-LINT-005.
  - Tests:
    - Missing alt text issue.
    - Heading order issue.
    - Form label issue.
    - Contrast issue.

- [x] **M3-T006: Implement link validator**
  - File: `packages/design/src/validators/links.ts`.
  - Requirements covered: REQ-LINT-006.
  - Tests:
    - Valid internal links pass.
    - Broken anchors fail.

- [x] **M3-T007: Implement page publish gate**
  - File: `packages/design/src/validators/publish-gate.ts`.
  - Integrate token, composition, hierarchy, accessibility, link, and content checks.
  - Requirements covered: REQ-LINT-007.
  - Tests:
    - Invalid page blocked.
    - Draft save allows warnings.
    - Valid page passes.

- [x] **M3-T008: Implement theme publish gate**
  - File: `packages/themes/src/theme-publish-gate.ts`.
  - Requirements covered: REQ-THEME-008.
  - Tests:
    - Invalid theme blocked.
    - Valid theme passes.
    - Issues returned in structured format.

## Exit criteria

- [x] Design validators run in unit tests.
- [x] Theme and page publish gates exist as reusable functions.
- [x] No UI integration required yet, but APIs are ready.

---

# M4 — Build Global Admin Theme Studio

## Goal

Move low-level theme creation into a Global Admin-only interface.

## Tasks

- [x] **M4-T001: Add Theme Studio routes**
  - Directory: `apps/admin-web/app/global-admin/theme-studio`.
  - Pages:
    - list theme families
    - create theme family
    - edit draft version
    - preview matrix
    - publish/deprecate/archive
  - Requirements covered: REQ-THEME-006.
  - Tests:
    - Route exists.
    - Global Admin access succeeds.
    - Tenant access denied.

- [x] **M4-T002: Add Theme Studio APIs/actions**
  - Add server actions or API routes for theme CRUD and lifecycle transitions.
  - Requirements covered: REQ-THEME-001 through REQ-THEME-009, REQ-SEC-001.
  - Tests:
    - Create draft.
    - Update draft.
    - Publish valid theme.
    - Block invalid theme.
    - Server-side permissions.

- [x] **M4-T003: Build token-based editor controls**
  - Global Admin controls may edit token scales, roles, recipes, and variations.
  - No arbitrary raw values unless creating a new token definition.
  - Requirements covered: REQ-PHIL-004, REQ-DS-001 through REQ-DS-011.
  - Tests:
    - Controls use token selectors.
    - Invalid raw values rejected.

- [x] **M4-T004: Build preview fixture matrix**
  - Files:
    - `packages/design/src/fixtures/theme-preview-fixtures.ts`
    - Theme Studio preview UI.
  - Requirements covered: REQ-THEME-007.
  - Tests:
    - Fixture registry contains homepage, booking page, service-list, CTA, rich-text, image overlay, mobile nav, empty state, form state.
    - Preview renders each fixture.

- [x] **M4-T005: Implement theme audit logging**
  - Requirements covered: REQ-THEME-009, REQ-SEC-003.
  - Tests:
    - Create/update/publish/deprecate/archive logs exist.

## Exit criteria

- [x] Global Admin can create and publish a valid theme.
- [x] Invalid themes cannot publish.
- [x] Tenant users cannot access Theme Studio.
- [x] Audit logs are written.

---

# M5 — Simplify Tenant Builder

## Goal

Remove low-level knobs from tenant-facing standard mode and replace them with a guided workflow.

## Tasks

- [ ] **M5-T001: Create Tenant Builder route structure**
  - Suggested directory: `apps/admin-web/app/tenant/builder`.
  - Keep existing routes redirecting or compatibility-wrapped.
  - Requirements covered: REQ-TB-001.
  - Tests:
    - Builder modes render.
    - Existing page edit URL still works or redirects.

- [ ] **M5-T002: Implement Compose mode**
  - Section actions: add, remove, reorder, duplicate, hide/show, variant select, recommended next section.
  - Requirements covered: REQ-TB-002.
  - Tests:
    - Add/reorder/hide persists.
    - Hidden section not public.
    - Recommended section renders.

- [ ] **M5-T003: Implement Content mode**
  - Render content fields from enriched block schemas.
  - Requirements covered: REQ-TB-003.
  - Tests:
    - Required fields shown.
    - Missing required fields produce quality issue.
    - Image alt warning.

- [ ] **M5-T004: Implement Style mode**
  - Curated selectors only: theme, mood, density, radius personality, image treatment, CTA emphasis.
  - Requirements covered: REQ-TB-004.
  - Tests:
    - Curated controls render.
    - Save produces tokenized overrides.
    - No raw color/font/spacing inputs.

- [ ] **M5-T005: Hide advanced controls by default**
  - Add explicit advanced panel if needed.
  - Use token selectors only.
  - Requirements covered: REQ-PHIL-004.
  - Tests:
    - Advanced collapsed by default.
    - Advanced controls token-constrained.

- [ ] **M5-T006: Remove serialized JSON debug output**
  - Requirements covered: REQ-TB-005.
  - Tests:
    - No raw JSON visible to tenant user.
    - Debug output gated by dev/admin flag.

- [ ] **M5-T007: Live preview parity**
  - Ensure preview uses same runtime compiler as public app.
  - Requirements covered: REQ-TB-006.
  - Tests:
    - Preview/public snapshot parity.

- [ ] **M5-T008: Device preview switcher**
  - Requirements covered: REQ-TB-007.
  - Tests:
    - Desktop/tablet/mobile preview modes.
    - Unsaved changes persist across mode switch.

- [ ] **M5-T009: Design quality panel**
  - Integrate publish-gate issues.
  - Requirements covered: REQ-TB-008.
  - Tests:
    - Quality score display.
    - Missing content warnings.
    - Blocking issues disable publish.

## Exit criteria

- [ ] Tenant standard builder is content-first.
- [ ] Low-level controls are not visible in standard mode.
- [ ] Page can be built, previewed, and published through new workflow.

---

# M6 — Refactor block governance

## Goal

Make blocks semantically governed, testable, and safe for beautiful-by-default composition.

## Tasks

- [ ] **M6-T001: Expand block definition schema**
  - File: `packages/core/src/page-block-registry.ts` or new block package if preferred.
  - Add `role`, `allowedPagePositions`, `maxPerPage`, `requiredContent`, `optionalContent`, `variants`, `designRules`, `compositionRules`.
  - Requirements covered: REQ-BLOCK-001.
  - Tests:
    - Every built-in block has enriched metadata.
    - Missing metadata fails.

- [ ] **M6-T002: Implement hero governance**
  - Requirements covered: REQ-BLOCK-002.
  - Tests:
    - Duplicate hero fails.
    - Hero not first warning/fail.
    - Missing headline/CTA fails.
    - Builder prevents second hero.

- [ ] **M6-T003: Implement CTA governance**
  - Requirements covered: REQ-BLOCK-003.
  - Tests:
    - Multiple primary actions fail.
    - CTA too early warning/fail.
    - CTA without action fails.

- [ ] **M6-T004: Implement rich-text readability rules**
  - Requirements covered: REQ-BLOCK-004.
  - Tests:
    - Max line length enforced.
    - Long centered text warns.
    - Visual fixture passes.

- [ ] **M6-T005: Implement image overlay readability**
  - Requirements covered: REQ-BLOCK-005.
  - Tests:
    - Unsafe overlay fails.
    - Scrim overlay passes.
    - Visual fixture passes.

- [ ] **M6-T006: Refactor service-list hierarchy**
  - Requirements covered: REQ-BLOCK-006.
  - Tests:
    - Semantic roles used.
    - Naive label-value clutter avoided for obvious values.
    - Visual fixture passes.

- [ ] **M6-T007: Implement block empty states**
  - Requirements covered: REQ-BLOCK-007.
  - Tests:
    - Empty service/location states render.
    - Quality panel flags missing dynamic content.

## Exit criteria

- [ ] All block definitions are enriched.
- [ ] Block validators pass.
- [ ] Builder uses block schema to drive UI.

---

# M7 — Visual regression, accessibility, and CI

## Goal

Make visual quality and accessibility enforceable in CI.

## Tasks

- [ ] **M7-T001: Add Playwright visual infrastructure**
  - Add scripts:
    - `e2e:visual`
    - `e2e:update-snapshots`
  - Requirements covered: REQ-VIS-001.
  - Tests:
    - CI can run Playwright.

- [ ] **M7-T002: Add theme fixture visual tests**
  - File: `tests/visual/theme-fixtures.spec.ts`.
  - Requirements covered: REQ-VIS-002.
  - Tests:
    - Every published theme fixture has screenshot.

- [ ] **M7-T003: Add preview/public parity visual tests**
  - File: `tests/visual/public-preview-parity.spec.ts`.
  - Requirements covered: REQ-VIS-003, REQ-TB-006.
  - Tests:
    - Preview screenshot matches public screenshot within threshold.

- [ ] **M7-T004: Add accessibility tests**
  - Add axe or equivalent if acceptable.
  - Test public homepage, booking form, builder form, Theme Studio form.
  - Requirements covered: REQ-LINT-005.
  - Tests:
    - No critical a11y violations.

- [ ] **M7-T005: Add CI workflow steps**
  - Update `.github/workflows/ci.yml`.
  - Include lint, typecheck, unit, integration, E2E, visual, accessibility checks.
  - Requirements covered: REQ-VIS-001, REQ-VIS-002, REQ-VIS-003.
  - Tests:
    - CI passes on clean branch.

## Exit criteria

- [ ] Visual regression tests run.
- [ ] Accessibility tests run.
- [ ] CI blocks visual/a11y regressions.

---

# M8 — Migration and compatibility

## Goal

Safely migrate existing presets, tenant assignments, and low-level overrides.

## Tasks

- [ ] **M8-T001: Add migration command**
  - Suggested script: `pnpm theme:migrate`.
  - Converts legacy theme data to new assignments.
  - Requirements covered: REQ-MIG-001, REQ-MIG-002.
  - Tests:
    - Migration transforms seeded tenant themes.
    - Migration report generated.

- [ ] **M8-T002: Add migration report**
  - Output converted, preserved, dropped, and warning counts.
  - Requirements covered: REQ-MIG-002.
  - Tests:
    - Snapshot report format.

- [ ] **M8-T003: Add fallback theme handling**
  - Requirements covered: REQ-MIG-003.
  - Tests:
    - Missing theme falls back.
    - Fallback event logged.

- [ ] **M8-T004: Backfill seeded data**
  - Update seed script to create ThemeFamily, ThemeVersion, TenantThemeAssignment.
  - Requirements covered: REQ-MIG-001.
  - Tests:
    - `pnpm db:seed` creates theme assignments.
    - Seeded tenants render.

## Exit criteria

- [ ] Existing seeded tenants work after migration.
- [ ] Legacy fields are mapped or safely ignored with warnings.
- [ ] Migration report exists.

---

# M9 — Performance, docs, and final hardening

## Goal

Make the refactor production-credible and maintainable.

## Tasks

- [ ] **M9-T001: Runtime compiler caching**
  - Cache compiled theme vars per theme version and tenant assignment.
  - Requirements covered: REQ-PERF-001.
  - Tests:
    - Compile deterministic.
    - Cache hit behavior.
    - Performance threshold.

- [ ] **M9-T002: Public bundle budget**
  - Ensure Theme Studio/editor code is not in public bundle.
  - Requirements covered: REQ-PERF-002.
  - Tests:
    - Bundle analyzer or script verifies budget.

- [ ] **M9-T003: Developer docs**
  - Files:
    - `docs/design-system.md`
    - `docs/theme-recipes.md`
    - `docs/design-validators.md`
    - `docs/theme-migration.md`
  - Requirements covered: REQ-DOC-001.
  - Tests:
    - Static docs existence test.
    - Link check if available.

- [ ] **M9-T004: Operator docs**
  - File: `docs/theme-studio-operator-guide.md`.
  - Requirements covered: REQ-DOC-002.
  - Tests:
    - Static docs existence test.

- [ ] **M9-T005: Remove deprecated tenant-facing low-level controls**
  - Delete or permanently gate old controls.
  - Requirements covered: REQ-PHIL-003, REQ-TB-001 through REQ-TB-005.
  - Tests:
    - Search/static tests verify no standard tenant low-level controls remain.

## Exit criteria

- [ ] Runtime is performant.
- [ ] Public bundle is clean.
- [ ] Docs exist.
- [ ] Old low-level tenant controls are removed/gated.

---

# 10. Requirement-to-test checklist

Use this checklist to ensure the specification has been fully translated into tests.

## Philosophy

- [ ] REQ-PHIL-001 tests implemented.
- [ ] REQ-PHIL-002 tests implemented.
- [ ] REQ-PHIL-003 tests implemented.
- [ ] REQ-PHIL-004 tests implemented.

## Design system

- [ ] REQ-DS-001 tests implemented.
- [ ] REQ-DS-002 tests implemented.
- [ ] REQ-DS-003 tests implemented.
- [ ] REQ-DS-004 tests implemented.
- [ ] REQ-DS-005 tests implemented.
- [ ] REQ-DS-006 tests implemented.
- [ ] REQ-DS-007 tests implemented.
- [ ] REQ-DS-008 tests implemented.
- [ ] REQ-DS-009 tests implemented.
- [ ] REQ-DS-010 tests implemented.
- [ ] REQ-DS-011 tests implemented.

## Theme Studio

- [ ] REQ-THEME-001 tests implemented.
- [ ] REQ-THEME-002 tests implemented.
- [ ] REQ-THEME-003 tests implemented.
- [ ] REQ-THEME-004 tests implemented.
- [ ] REQ-THEME-005 tests implemented.
- [ ] REQ-THEME-006 tests implemented.
- [ ] REQ-THEME-007 tests implemented.
- [ ] REQ-THEME-008 tests implemented.
- [ ] REQ-THEME-009 tests implemented.

## Tenant Builder

- [ ] REQ-TB-001 tests implemented.
- [ ] REQ-TB-002 tests implemented.
- [ ] REQ-TB-003 tests implemented.
- [ ] REQ-TB-004 tests implemented.
- [ ] REQ-TB-005 tests implemented.
- [ ] REQ-TB-006 tests implemented.
- [ ] REQ-TB-007 tests implemented.
- [ ] REQ-TB-008 tests implemented.

## Blocks

- [ ] REQ-BLOCK-001 tests implemented.
- [ ] REQ-BLOCK-002 tests implemented.
- [ ] REQ-BLOCK-003 tests implemented.
- [ ] REQ-BLOCK-004 tests implemented.
- [ ] REQ-BLOCK-005 tests implemented.
- [ ] REQ-BLOCK-006 tests implemented.
- [ ] REQ-BLOCK-007 tests implemented.

## Lint and publish gates

- [ ] REQ-LINT-001 tests implemented.
- [ ] REQ-LINT-002 tests implemented.
- [ ] REQ-LINT-003 tests implemented.
- [ ] REQ-LINT-004 tests implemented.
- [ ] REQ-LINT-005 tests implemented.
- [ ] REQ-LINT-006 tests implemented.
- [ ] REQ-LINT-007 tests implemented.

## Visual regression

- [ ] REQ-VIS-001 tests implemented.
- [ ] REQ-VIS-002 tests implemented.
- [ ] REQ-VIS-003 tests implemented.

## Migration

- [ ] REQ-MIG-001 tests implemented.
- [ ] REQ-MIG-002 tests implemented.
- [ ] REQ-MIG-003 tests implemented.

## Security

- [ ] REQ-SEC-001 tests implemented.
- [ ] REQ-SEC-002 tests implemented.
- [ ] REQ-SEC-003 tests implemented.

## Performance

- [ ] REQ-PERF-001 tests implemented.
- [ ] REQ-PERF-002 tests implemented.

## Docs

- [ ] REQ-DOC-001 tests implemented.
- [ ] REQ-DOC-002 tests implemented.

---

# 11. Final acceptance checklist

The refactor is done only when all boxes below are checked:

- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm e2e` passes.
- [ ] `pnpm e2e:visual` passes or has approved baselines.
- [ ] Existing seeded tenants render.
- [ ] Global Admin can create and publish a theme.
- [ ] Tenant Builder cannot see low-level design knobs in standard mode.
- [ ] Tenant Builder can compose, edit content, select style, preview, and publish.
- [ ] Invalid themes cannot publish.
- [ ] Invalid pages cannot publish.
- [ ] Visual regression exists for every published built-in theme.
- [ ] Accessibility tests pass for public homepage and builder-critical flows.
- [ ] Migration report exists.
- [ ] Operator and developer docs exist.
