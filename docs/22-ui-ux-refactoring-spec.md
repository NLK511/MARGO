# MARGO UI / UX Refactoring Specifications

**Document purpose:** Execution-ready specification for refactoring MARGO into a beautiful-by-default website factory with a Global Admin Theme Studio, constrained Tenant Builder, design-system tokens, design linting, and testable quality gates.

**Intended consumer:** AI coding agent or engineering team implementing the refactor in `NLK511/MARGO`.

**Primary product goal:** MARGO should be the fastest way for an SMB to launch a beautiful, effective, accessible webapp without becoming a low-level design tool.

---

## 1. Strategic intent

MARGO must become a **constrained website factory**, not a blank-canvas editor.

Tenant users do not design from scratch. They choose a business goal, content, images, and a curated visual direction. MARGO composes the page using design-system rules, approved theme recipes, tested block variants, and publishing gates.

- Global Admin owns the visual system.
- Tenant Builder consumes curated themes and section patterns.
- Tenant Owner Portal focuses on operating the business.
- Public Webapp renders the final tenant experience.

MARGO should encode UI quality into software primitives so that pages do not drift away from strong visual hierarchy, spacing discipline, type discipline, contrast, accessibility, image readability, and clean defaults.

---

## 2. Current-state diagnosis

The repo already has foundations:

- TypeScript monorepo with `apps/public-web`, `apps/admin-web`, `apps/api`, shared packages, CI, DB scripts, and local infra.
- Product split between Global Studio / Global Admin, Tenant Builder / Tenant Admin, Tenant Owner Portal, and Public Webapp.
- Theme presets and runtime CSS variable compilation.
- Block registry with intended-use descriptions.

The main architectural problem is that low-level visual controls are exposed too broadly. Current tenant-facing editors allow granular control over fonts, colors, spacing, margins, padding, line-height, image overlays, button appearance, nav behavior, and block-level typography. This makes it too easy to create visually inconsistent websites and too slow to produce good outcomes.

This refactor must move low-level visual-system creation into Global Admin Theme Studio and simplify Tenant Builder into a content-first, recipe-driven workflow.

---

## 3. Product doctrine

1. Beautiful by default.
2. Systems before settings.
3. Feature first, layout second.
4. Personality is encoded.
5. Tenant users choose outcomes.
6. Global Admin creates systems.
7. Publish only if quality gates pass.

---

## 4. Scope

### In scope

- New `packages/design` package.
- Refactor `packages/themes` around design tokens, recipes, theme families, and versioning.
- Global Admin Theme Studio.
- Tenant Builder simplification.
- Tokenized theme/runtime compiler.
- Block definition governance.
- Page composition rules.
- Design lint validators.
- Publish gates.
- Visual regression tests.
- Accessibility and contrast checks.
- Migration of current presets and overrides.
- Backward-compatible rendering during migration.

### Out of scope

- Rebuilding the entire booking/CRM product.
- Adding payments, SMS, real email, or calendar integrations.
- Building a Figma-level design editor.
- Supporting arbitrary custom CSS from tenant users.
- Marketplace/template monetization.

---

## 5. User roles and responsibilities

| Role | Responsibility | Visual power |
|---|---|---|
| Global Admin / MARGO operator | Create, test, publish, version, and deprecate themes and recipes | High, but constrained by tokens and validators |
| Tenant Builder / Tenant Admin | Select and lightly configure approved recipes | Medium-low |
| Tenant Owner / Staff | Operate bookings, CRM, business workflows | None except business content |
| Public visitor | Consume rendered website | None |

---

## 6. Required target architecture

```txt
packages/
  design/
    src/
      doctrine.ts
      tokens/
        space.ts
        size.ts
        typography.ts
        color.ts
        radius.ts
        elevation.ts
        border.ts
        opacity.ts
        motion.ts
        z-index.ts
      semantics/
        hierarchy.ts
        intent.ts
        density.ts
        personality.ts
        page-goal.ts
      recipes/
        design-recipe.ts
        built-ins.ts
      validators/
        contrast.ts
        token-usage.ts
        page-composition.ts
        block-composition.ts
        image-contrast.ts
        accessibility.ts
        publish-gate.ts
      fixtures/
        theme-preview-fixtures.ts
        block-preview-fixtures.ts
      css/
        compile-design-vars.ts

  themes/
    src/
      theme-family.ts
      theme-version.ts
      theme-recipe.ts
      theme-runtime.ts
      theme-migration.ts
      theme-repository-contract.ts
      index.ts

apps/
  admin-web/
    app/
      global-admin/
        theme-studio/
      tenant/
        builder/
      owner/

  public-web/
    app/
      runtime rendering using tokenized themes only
```

`packages/design` owns universal rules. `packages/themes` owns theme domain models and runtime compilation. `apps/admin-web` exposes role-specific editing surfaces.

---

## 7. Requirements and tests

The detailed requirements are captured in sections A–K below. Each requirement is mandatory unless explicitly marked P2 or Later. Each must be backed by tests.

### A. Philosophy and governance

- REQ-PHIL-001: Encode UI doctrine in source-controlled constants.
- REQ-PHIL-002: Role-specific visual authority.
- REQ-PHIL-003: No tenant-facing arbitrary design values in standard mode.
- REQ-PHIL-004: Advanced mode must be explicit and token-constrained.

### B. Design tokens

- REQ-DS-001: Canonical spacing scale.
- REQ-DS-002: Canonical typography scale.
- REQ-DS-003: Typography roles instead of per-heading arbitrary fonts.
- REQ-DS-004: Font pairing constraints.
- REQ-DS-005: HSL-based color model with semantic tokens.
- REQ-DS-006: Contrast requirements.
- REQ-DS-007: No grey text on colored backgrounds unless validated.
- REQ-DS-008: Radius scale and personality mapping.
- REQ-DS-009: Elevation scale.
- REQ-DS-010: Motion tokens and reduced-motion support.
- REQ-DS-011: Token compiler emits stable CSS variables.

### C. Theme model and Global Theme Studio

- REQ-THEME-001: Theme Family model.
- REQ-THEME-002: Theme versioning.
- REQ-THEME-003: Theme lifecycle.
- REQ-THEME-004: Theme recipe model.
- REQ-THEME-005: Built-in theme migration.
- REQ-THEME-006: Global Theme Studio route group.
- REQ-THEME-007: Theme Studio preview matrix.
- REQ-THEME-008: Theme publish gate.
- REQ-THEME-009: Theme audit log.

### D. Tenant Builder

- REQ-TB-001: Tenant Builder modes.
- REQ-TB-002: Compose mode section management.
- REQ-TB-003: Content mode field editing.
- REQ-TB-004: Style mode curated options.
- REQ-TB-005: Remove serialized JSON state from normal UI.
- REQ-TB-006: Live preview parity.
- REQ-TB-007: Device preview.
- REQ-TB-008: Design quality panel.

### E. Block system

- REQ-BLOCK-001: Enriched block definition schema.
- REQ-BLOCK-002: Hero governance.
- REQ-BLOCK-003: CTA governance.
- REQ-BLOCK-004: Rich text readability.
- REQ-BLOCK-005: Image overlay readability.
- REQ-BLOCK-006: Service list hierarchy.
- REQ-BLOCK-007: Empty states.

### F. Design lint and publish-gate

- REQ-LINT-001: Design lint package.
- REQ-LINT-002: Token usage validator.
- REQ-LINT-003: Page composition validator.
- REQ-LINT-004: Visual hierarchy validator.
- REQ-LINT-005: Accessibility validator.
- REQ-LINT-006: Link validator.
- REQ-LINT-007: Publish gate integration.

### G. Visual regression and CI

- REQ-VIS-001: Playwright visual test suite.
- REQ-VIS-002: Theme fixture matrix.
- REQ-VIS-003: Public and preview parity visual tests.

### H. Migration and backward compatibility

- REQ-MIG-001: Existing tenant compatibility.
- REQ-MIG-002: Low-level override migration report.
- REQ-MIG-003: Safe fallback theme.

### I. Security, permissions, and audit

- REQ-SEC-001: Server-side enforcement.
- REQ-SEC-002: Tenant isolation.
- REQ-SEC-003: Audit trail.

### J. Performance and runtime

- REQ-PERF-001: Runtime compiler performance.
- REQ-PERF-002: No client-side dependency bloat in public runtime.

### K. Documentation

- REQ-DOC-001: Developer documentation.
- REQ-DOC-002: Operator documentation.

---

## 8. Data model proposal

The implementation may adapt this to the existing DB structure, but the system must support equivalent concepts.

```prisma
model ThemeFamily {
  id          String   @id
  name        String
  description String?
  verticalFit Json
  personality String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  versions    ThemeVersion[]
}

model ThemeVersion {
  id             String   @id
  themeFamilyId  String
  version        String
  lifecycle      String
  recipe         Json
  migrationNotes Json?
  createdByUserId String?
  createdAt      DateTime @default(now())
  publishedAt    DateTime?
  deprecatedAt   DateTime?
  family         ThemeFamily @relation(fields: [themeFamilyId], references: [id])
}

model TenantThemeAssignment {
  id             String   @id
  tenantId        String
  themeFamilyId   String
  themeVersionId  String
  recipeVariation Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 9. Public runtime contract

Public runtime must receive only resolved, validated theme output.

```ts
export type RuntimeTheme = {
  themeFamilyId: string;
  themeVersionId: string;
  recipeId: string;
  cssVars: Record<string, string>;
  dataAttributes: Record<string, string>;
  typographyRoles: ResolvedTypographyRoles;
  semanticColors: ResolvedSemanticColors;
  sectionRules: ResolvedSectionRules;
};
```

Public components must consume semantic variables and block role tokens, never raw tenant-defined arbitrary styles.

---

## 10. Mandatory test map summary

The implementation must create tests in these categories:

```txt
packages/design/src/**/*.test.ts
packages/themes/src/**/*.test.ts
apps/admin-web/**/*.test.tsx
tests/integration/theme-studio.test.ts
tests/integration/tenant-builder.test.ts
tests/integration/publish-gate.test.ts
tests/e2e/builder-flow.spec.ts
tests/e2e/theme-studio.spec.ts
tests/visual/theme-fixtures.spec.ts
tests/visual/public-preview-parity.spec.ts
```

A requirement is not complete until its corresponding tests are implemented and passing.

---

## 11. Definition of done

The refactor is complete only when:

- Global Admin can create, preview, validate, publish, deprecate, and archive themes.
- Tenant Builder no longer exposes low-level knobs in standard mode.
- Existing seeded tenants still render.
- Public runtime consumes tokenized theme output.
- Every built-in theme has visual baselines.
- Every publish action runs design lint and blocks invalid pages.
- Every requirement in this document has passing tests.
- CI runs lint, typecheck, unit tests, integration tests, E2E tests, accessibility tests, and visual regression tests.
