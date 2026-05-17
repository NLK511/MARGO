## Goal

The app must be highly customizable in both theme and layout without requiring code forks.

## Layers

1. Global design tokens
2. White-label preset/theme tokens
3. Tenant branding and overrides
4. Page/block layout configuration
5. Component variants

Themes are reusable platform assets and must not contain tenant logos, tenant photos, or tenant-specific copy. Branding is tenant-specific and may override or extend a selected theme. Global Admin may edit built-in themes too; those edits are stored as local overrides rather than mutating the shipped preset source.

Theme Studio should present an inventory with an explicit **Edit theme** action per item and keep a live mock preview visible while adjusting colors, typography, sizes, spacing, and assets.

## Theme Token Schema

```ts
interface ThemeTokens {
  id: string;
  name: string;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryContrast: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
  };
  typography: {
    fontSans: string;
    fontSerif?: string;
    fontDisplay: string;
    headingWeight: number;
    bodyWeight: number;
    scale: 'compact' | 'standard' | 'editorial' | 'bold';
  };
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    marginXs: string;
    marginSm: string;
    marginMd: string;
    marginLg: string;
    paddingXs: string;
    paddingSm: string;
    paddingMd: string;
    paddingLg: string;
    interlineXs: string;
    interlineSm: string;
    interlineMd: string;
    interlineLg: string;
    density: 'compact' | 'comfortable' | 'spacious';
    sectionY: string;
    containerMax: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  motion: {
    intensity: 'none' | 'subtle' | 'expressive';
    durationFast: string;
    durationNormal: string;
  };
  components: {
    buttonVariant: string;
    cardVariant: string;
    inputVariant: string;
    navVariant: string;
  };
}
```

## CSS Variable Output

Each theme must compile to CSS variables:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-primary: #2563eb;
  --radius-md: 16px;
  --font-sans: Inter, system-ui, sans-serif;
  --section-y: 96px;
}
```

## Layout System

Page layouts are block-based and can be presented in multiple styles.
The theme preset selects the baseline template. Tenant layout settings can fine-tune width, nav, hero, rhythm, section dividers, surface treatment, and navigation item spacing.

```ts
interface LayoutConfig {
  template: 'classic' | 'split' | 'editorial' | 'dashboard' | 'immersive';
  nav: 'top' | 'centered' | 'sidebar' | 'minimal' | 'overlay';
  navSticky: boolean;
  hero: 'centered' | 'split-image' | 'full-bleed' | 'card-stack' | 'brutalist';
  contentWidth: 'centered' | 'wide' | 'full';
  sectionRhythm: 'none' | 'compact' | 'standard' | 'spacious';
  sectionDivider: 'thin' | 'thick' | 'none';
  surfaceStyle: 'flat' | 'bordered' | 'soft-shadow' | 'glass' | 'brutalist';
  surfaceRadius: 'round' | 'square';
}
```

## Refactor Note

The UI/UX refactor target is defined in `docs/22-ui-ux-refactoring-spec.md`.

That spec supersedes the old assumption that tenant builders should control raw margins, padding, font sizes, per-heading typography, arbitrary colors, custom CSS, and other low-level visual primitives in standard mode.

Current direction:

- Global Admin owns reusable theme families, versions, recipes, and token systems.
- Tenant Builder standard mode is content-first and curated.
- Advanced design controls, if any, are explicit, token-only, and gated.
- Public runtime continues to consume theme/layout output, but via constrained design tokens.

---

