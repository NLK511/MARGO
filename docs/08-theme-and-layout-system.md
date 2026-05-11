## Goal

The app must be highly customizable in both theme and layout without requiring code forks.

## Layers

1. Global design tokens
2. Preset tokens
3. Tenant overrides
4. Page/block layout configuration
5. Component variants

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
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: {
    density: 'compact' | 'comfortable' | 'spacious';
    sectionY: string;
    containerMax: string;
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

Page layouts are block-based.

```ts
interface LayoutConfig {
  template: 'classic' | 'split' | 'editorial' | 'dashboard' | 'immersive';
  nav: 'top' | 'centered' | 'sidebar' | 'minimal' | 'overlay';
  hero: 'centered' | 'split-image' | 'full-bleed' | 'card-stack' | 'brutalist';
  sectionRhythm: 'compact' | 'standard' | 'spacious';
  cardStyle: 'flat' | 'bordered' | 'soft-shadow' | 'glass' | 'brutalist';
}
```

## Admin Customization UI

Tenant owner can change:

- logo
- favicon
- primary colors
- theme preset
- font pair
- border radius intensity
- button style
- nav layout
- homepage block order
- hero variant
- CTA style
- dark/light preference where preset supports it

## Acceptance Criteria

- Theme switch does not require rebuild.
- Tenant overrides are persisted.
- Theme tokens are validated.
- All presets meet contrast requirements.
- Blocks render correctly under every preset.
- Admin preview shows desktop/tablet/mobile.

---

