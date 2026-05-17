## Goal

The app must be highly customizable in both theme and layout without requiring code forks.

## Layers

1. Global design tokens
2. White-label preset/theme tokens
3. Tenant branding and overrides
4. Page/block layout configuration
5. Component variants

Themes are reusable platform assets and must not contain tenant logos, tenant photos, or tenant-specific copy. Branding is tenant-specific and may override or extend a selected theme.

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

## Branding-Level Defaults

Tenant branding must be able to define reusable defaults for content blocks, including:

- margin presets and explicit margin size values
- padding presets
- interline presets
- font family defaults
- font size defaults
- font color defaults
- navigation item gap presets

Blocks inherit these values unless explicitly overridden at block level.
Margin controls should offer a smooth scale from very small to the existing standard size, and zero/very small values must persist correctly through save and preview.
Navigation chrome must not inherit block margins; the menu bar keeps its own spacing model and only uses its own gap/padding controls.

## Tenant Builder Customization UI

Tenant admins/builders can change:

- logo
- favicon
- primary colors
- theme preset
- font pair
- surface style and corner radius
- button style
- nav layout
- sticky menu toggle
- side margins / full width
- homepage block order
- hero variant
- classic vs refined editorial homepage presentation
- logo / logotype / favicon
- font selection per body, display, H1, H2, H3, and paragraph text
- block text styling through one shared text settings component
- numeric font size controls for block text
- text alignment buttons for block text
- optional background images for page, hero, and cards/surfaces
- section rhythm and section dividers
- menu item spacing
- CTA style
- dark/light preference where preset supports it

The admin preview must expose desktop / tablet / mobile viewports.

## Acceptance Criteria

- Theme switch does not require rebuild.
- Tenant overrides are persisted.
- Theme tokens are validated before save.
- All presets meet contrast requirements.
- Blocks render correctly under every preset.
- Admin preview shows desktop/tablet/mobile.
- Block registry stays small and intentional; specialized content should prefer presets over new block types.

---

