export * from './theme-family';
export * from './theme-migration';
export * from './theme-recipe';
export * from './theme-runtime';
export * from './theme-publish-gate';

export type ThemeScale = 'standard' | 'editorial' | 'bold';
export type ThemeTemplate = 'classic' | 'editorial' | 'split' | 'immersive';
export type ThemeNav = 'top' | 'centered' | 'minimal' | 'overlay';
export type ThemeHero = 'split-image' | 'full-bleed' | 'card-stack' | 'brutalist';
export type ThemeSectionRhythm = 'none' | 'compact' | 'spacious';
export type ThemeContentWidth = 'centered' | 'wide' | 'full';
export type ThemeSectionBorder = 'thin' | 'thick' | 'none';
export type ThemeCardStyle = 'soft-shadow' | 'flat' | 'brutalist' | 'glass';
export type ThemeCardRadius = 'round' | 'square';

export interface ThemeColors {
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
}

export interface ThemeTypography {
  fontSans: string;
  fontSerif?: string;
  fontDisplay: string;
  fontH1?: string;
  fontH2?: string;
  fontH3?: string;
  fontBody?: string;
  fontParagraph?: string;
  fontSansColor?: string;
  fontDisplayColor?: string;
  fontH1Color?: string;
  fontH2Color?: string;
  fontH3Color?: string;
  fontBodyColor?: string;
  fontParagraphColor?: string;
  headingWeight: number;
  bodyWeight: number;
  scale: ThemeScale;
}

export interface ThemeAssets {
  backgroundImageUrl?: string;
  cardBackgroundImageUrl?: string;
  heroBackgroundImageUrl?: string;
}

export interface ThemeSpacing {
  pagePadding?: string;
  sectionGap?: string;
  cardPadding?: string;
  heroPadding?: string;
  navGap?: string;
  contentGap?: string;
  blockGap?: string;
}

export interface ThemeLayout {
  template: ThemeTemplate;
  nav: ThemeNav;
  navSticky: boolean;
  hero: ThemeHero;
  contentWidth: ThemeContentWidth;
  sectionRhythm: ThemeSectionRhythm;
  sectionBorder: ThemeSectionBorder;
  cardStyle: ThemeCardStyle;
  cardRadius: ThemeCardRadius;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  assets?: ThemeAssets;
  spacing?: ThemeSpacing;
}

export type ThemeOverrides = {
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  layout?: Partial<ThemeLayout>;
  assets?: Partial<ThemeAssets>;
  spacing?: Partial<ThemeSpacing>;
};

export interface ThemeValidationIssue {
  path: string;
  message: string;
}

const colorKeys = [
  'bg',
  'surface',
  'surfaceAlt',
  'text',
  'textMuted',
  'border',
  'primary',
  'primaryContrast',
  'secondary',
  'accent',
  'success',
  'warning',
  'danger',
] as const satisfies readonly (keyof ThemeColors)[];

const hexColorPattern = /^#[0-9a-f]{6}$/i;

export const themePresets = [
  {
    id: 'clinical-calm',
    name: 'Clinical Calm',
    colors: {
      bg: '#F7FAFC',
      surface: '#FFFFFF',
      surfaceAlt: '#EEF6F8',
      text: '#10233A',
      textMuted: '#5A6B7B',
      border: '#D7E3EA',
      primary: '#2D7DD2',
      primaryContrast: '#FFFFFF',
      secondary: '#68B0AB',
      accent: '#BEE3DB',
      success: '#2F855A',
      warning: '#B7791F',
      danger: '#C53030',
    },
    typography: {
      fontSans: 'Inter',
      fontDisplay: 'Inter',
      headingWeight: 700,
      bodyWeight: 400,
      scale: 'standard',
    },
    layout: {
      template: 'classic',
      nav: 'top',
      navSticky: true,
      hero: 'split-image',
      contentWidth: 'centered',
      sectionRhythm: 'spacious',
      sectionBorder: 'thin',
      cardStyle: 'soft-shadow',
      cardRadius: 'round',
    },
  },
  {
    id: 'editorial-bistro',
    name: 'Editorial Bistro',
    colors: {
      bg: '#F8F1E8',
      surface: '#FFF9F1',
      surfaceAlt: '#EFE0D0',
      text: '#2F231B',
      textMuted: '#6D5A4B',
      border: '#D7C2AE',
      primary: '#8B3D1F',
      primaryContrast: '#FFFFFF',
      secondary: '#C27945',
      accent: '#E8B86D',
      success: '#557A46',
      warning: '#A15C20',
      danger: '#9B2C2C',
    },
    typography: {
      fontSans: 'Inter',
      fontSerif: 'Cormorant Garamond',
      fontDisplay: 'Cormorant Garamond',
      headingWeight: 600,
      bodyWeight: 400,
      scale: 'editorial',
    },
    layout: {
      template: 'editorial',
      nav: 'centered',
      navSticky: true,
      hero: 'full-bleed',
      contentWidth: 'wide',
      sectionRhythm: 'spacious',
      sectionBorder: 'thin',
      cardStyle: 'flat',
      cardRadius: 'round',
    },
  },
  {
    id: 'organic-wellness',
    name: 'Organic Wellness',
    colors: {
      bg: '#FBFAF4',
      surface: '#F3EFE4',
      surfaceAlt: '#E6E0CF',
      text: '#2E372C',
      textMuted: '#6C705F',
      border: '#D7CFB8',
      primary: '#6F8B5C',
      primaryContrast: '#FFFFFF',
      secondary: '#B9956B',
      accent: '#D9C6A5',
      success: '#4F7942',
      warning: '#A36A2A',
      danger: '#A94442',
    },
    typography: {
      fontSans: 'Nunito Sans',
      fontDisplay: 'Playfair Display',
      headingWeight: 600,
      bodyWeight: 400,
      scale: 'standard',
    },
    layout: {
      template: 'split',
      nav: 'minimal',
      navSticky: true,
      hero: 'card-stack',
      contentWidth: 'wide',
      sectionRhythm: 'spacious',
      sectionBorder: 'thin',
      cardStyle: 'soft-shadow',
      cardRadius: 'round',
    },
  },
  {
    id: 'neo-brutalist-local',
    name: 'Neo-Brutalist Local',
    colors: {
      bg: '#FFFDF6',
      surface: '#FFFFFF',
      surfaceAlt: '#FFE769',
      text: '#141414',
      textMuted: '#3B3B3B',
      border: '#141414',
      primary: '#FF5A36',
      primaryContrast: '#141414',
      secondary: '#00B3A4',
      accent: '#FFE769',
      success: '#00A86B',
      warning: '#FFB000',
      danger: '#E63946',
    },
    typography: {
      fontSans: 'Space Grotesk',
      fontDisplay: 'Space Grotesk',
      headingWeight: 800,
      bodyWeight: 500,
      scale: 'bold',
    },
    layout: {
      template: 'classic',
      nav: 'top',
      navSticky: true,
      hero: 'brutalist',
      contentWidth: 'full',
      sectionRhythm: 'compact',
      sectionBorder: 'thick',
      cardStyle: 'brutalist',
      cardRadius: 'square',
    },
  },
  {
    id: 'luxury-dark-dining',
    name: 'Luxury Dark Dining',
    colors: {
      bg: '#111315',
      surface: '#1A1D20',
      surfaceAlt: '#25211B',
      text: '#F4EFE6',
      textMuted: '#B8AC97',
      border: '#40362A',
      primary: '#C8A96B',
      primaryContrast: '#111315',
      secondary: '#8A6F3E',
      accent: '#E6D3A3',
      success: '#8DB580',
      warning: '#D2A24C',
      danger: '#D16666',
    },
    typography: {
      fontSans: 'Inter',
      fontSerif: 'Bodoni Moda',
      fontDisplay: 'Bodoni Moda',
      headingWeight: 500,
      bodyWeight: 400,
      scale: 'editorial',
    },
    layout: {
      template: 'immersive',
      nav: 'overlay',
      navSticky: false,
      hero: 'full-bleed',
      contentWidth: 'full',
      sectionRhythm: 'spacious',
      sectionBorder: 'none',
      cardStyle: 'glass',
      cardRadius: 'round',
    },
  },
  {
    id: 'chef',
    name: 'Chef',
    colors: {
      bg: '#FBF6F0',
      surface: '#FFFCF8',
      surfaceAlt: '#F0E5D8',
      text: '#171412',
      textMuted: '#63584D',
      border: '#D9CBB9',
      primary: '#6E3E2B',
      primaryContrast: '#FFFFFF',
      secondary: '#A47A4E',
      accent: '#C8A96B',
      success: '#557A46',
      warning: '#A36A2A',
      danger: '#9B2C2C',
    },
    typography: {
      fontSans: 'Inter',
      fontSerif: 'Playfair Display',
      fontDisplay: 'Playfair Display',
      fontH1: 'Cormorant Garamond',
      fontH2: 'Cormorant Garamond',
      fontH3: 'Cormorant Garamond',
      fontBody: 'Inter',
      fontParagraph: 'Inter',
      headingWeight: 500,
      bodyWeight: 400,
      scale: 'editorial',
    },
    layout: {
      template: 'editorial',
      nav: 'centered',
      navSticky: true,
      hero: 'full-bleed',
      contentWidth: 'wide',
      sectionRhythm: 'spacious',
      sectionBorder: 'thin',
      cardStyle: 'flat',
      cardRadius: 'round',
    },
  },
] as const satisfies readonly ThemePreset[];

export const clinicalCalm = themePresets[0];
export const defaultThemePreset = clinicalCalm;

export function getThemePreset(presetId: string | null | undefined): ThemePreset {
  return themePresets.find((preset) => preset.id === presetId) ?? defaultThemePreset;
}

const defaultThemeSpacing: Required<ThemeSpacing> = {
  pagePadding: 'clamp(16px, 4vw, 48px)',
  sectionGap: '64px',
  cardPadding: '24px',
  heroPadding: 'clamp(48px, 7vw, 96px)',
  navGap: '16px',
  contentGap: '32px',
  blockGap: '24px',
};

export function mergeTheme(preset: ThemePreset, overrides: ThemeOverrides = {}): ThemePreset {
  return {
    ...preset,
    colors: { ...preset.colors, ...overrides.colors },
    typography: { ...preset.typography, ...overrides.typography },
    layout: { ...preset.layout, ...overrides.layout },
    assets: { ...(preset.assets ?? {}), ...overrides.assets },
    spacing: { ...defaultThemeSpacing, ...(preset.spacing ?? {}), ...overrides.spacing },
  };
}

export function validateThemePreset(theme: ThemePreset): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];

  if (!theme.id.trim()) issues.push({ path: 'id', message: 'Theme id is required.' });
  if (!theme.name.trim()) issues.push({ path: 'name', message: 'Theme name is required.' });

  for (const key of colorKeys) {
    if (!hexColorPattern.test(theme.colors[key])) {
      issues.push({ path: `colors.${key}`, message: 'Color must be a 6-digit hex value.' });
    }
  }

  if (!isWeight(theme.typography.headingWeight)) {
    issues.push({ path: 'typography.headingWeight', message: 'Heading weight must be between 100 and 900.' });
  }
  if (!isWeight(theme.typography.bodyWeight)) {
    issues.push({ path: 'typography.bodyWeight', message: 'Body weight must be between 100 and 900.' });
  }

  if (contrastRatio(theme.colors.text, theme.colors.bg) < 4.5) {
    issues.push({ path: 'colors.text', message: 'Text must have at least 4.5:1 contrast on background.' });
  }
  if (contrastRatio(theme.colors.primaryContrast, theme.colors.primary) < 3) {
    issues.push({ path: 'colors.primaryContrast', message: 'Primary contrast must have at least 3:1 contrast.' });
  }

  for (const [key, value] of Object.entries(theme.spacing ?? {})) {
    if (value !== undefined && !isCssLength(value)) {
      issues.push({ path: `spacing.${key}`, message: 'Spacing values must be CSS lengths.' });
    }
  }

  return issues;
}

export function assertValidThemePreset(theme: ThemePreset): void {
  const issues = validateThemePreset(theme);
  if (issues.length > 0) {
    throw new ThemeValidationError(issues);
  }
}

export class ThemeValidationError extends Error {
  constructor(public readonly issues: ThemeValidationIssue[]) {
    super(`Invalid theme preset: ${issues.map((issue) => issue.path).join(', ')}`);
    this.name = 'ThemeValidationError';
  }
}

export function compileThemeCssVariables(theme: ThemePreset): Record<string, string> {
  return {
    '--color-bg': theme.colors.bg,
    '--color-surface': theme.colors.surface,
    '--color-surface-alt': theme.colors.surfaceAlt,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
    '--color-border': theme.colors.border,
    '--color-primary': theme.colors.primary,
    '--color-primary-contrast': theme.colors.primaryContrast,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-danger': theme.colors.danger,
    '--font-sans': fontStack(theme.typography.fontSans),
    '--font-serif': fontStack(theme.typography.fontSerif ?? theme.typography.fontDisplay),
    '--font-display': fontStack(theme.typography.fontDisplay),
    '--font-h1': fontStack(theme.typography.fontH1 ?? theme.typography.fontDisplay),
    '--font-h2': fontStack(theme.typography.fontH2 ?? theme.typography.fontDisplay),
    '--font-h3': fontStack(theme.typography.fontH3 ?? theme.typography.fontDisplay),
    '--font-body': fontStack(theme.typography.fontBody ?? theme.typography.fontSans),
    '--font-paragraph': fontStack(theme.typography.fontParagraph ?? theme.typography.fontBody ?? theme.typography.fontSans),
    '--font-sans-color': theme.typography.fontSansColor ?? theme.colors.text,
    '--font-display-color': theme.typography.fontDisplayColor ?? theme.colors.text,
    '--font-h1-color': theme.typography.fontH1Color ?? theme.typography.fontDisplayColor ?? theme.colors.text,
    '--font-h2-color': theme.typography.fontH2Color ?? theme.typography.fontDisplayColor ?? theme.colors.text,
    '--font-h3-color': theme.typography.fontH3Color ?? theme.typography.fontDisplayColor ?? theme.colors.text,
    '--font-body-color': theme.typography.fontBodyColor ?? theme.colors.text,
    '--font-paragraph-color': theme.typography.fontParagraphColor ?? theme.typography.fontBodyColor ?? theme.colors.text,
    '--font-heading-weight': String(theme.typography.headingWeight),
    '--font-body-weight': String(theme.typography.bodyWeight),
    '--radius-md': theme.layout.cardStyle === 'brutalist' ? '4px' : theme.layout.cardStyle === 'glass' ? '20px' : '16px',
    '--radius-card': theme.layout.cardRadius === 'square' ? '0px' : theme.layout.cardStyle === 'glass' ? '20px' : theme.layout.cardStyle === 'brutalist' ? '4px' : '16px',
    '--shadow-card': cardShadow(theme.layout.cardStyle),
    '--content-max': contentMaxValue(theme.layout.contentWidth),
    '--page-padding': resolveSpacingValue(theme.spacing?.pagePadding, defaultThemeSpacing.pagePadding),
    '--section-gap': resolveSpacingValue(theme.spacing?.sectionGap, sectionGapValue(theme.layout.sectionRhythm)),
    '--card-padding': resolveSpacingValue(theme.spacing?.cardPadding, defaultThemeSpacing.cardPadding),
    '--hero-padding': resolveSpacingValue(theme.spacing?.heroPadding, defaultThemeSpacing.heroPadding),
    '--nav-gap': resolveSpacingValue(theme.spacing?.navGap, defaultThemeSpacing.navGap),
    '--content-gap': resolveSpacingValue(theme.spacing?.contentGap, defaultThemeSpacing.contentGap),
    '--block-gap': resolveSpacingValue(theme.spacing?.blockGap, defaultThemeSpacing.blockGap),
    '--section-border-width': sectionBorderWidthValue(theme.layout.sectionBorder),
    '--section-border-style': theme.layout.sectionBorder === 'none' ? 'none' : 'solid',
    '--nav-position': theme.layout.navSticky ? 'sticky' : 'static',
    '--background-image': backgroundImageValue(theme.assets?.backgroundImageUrl),
    '--card-background-image': backgroundImageValue(theme.assets?.cardBackgroundImageUrl),
    '--hero-background-image': backgroundImageValue(theme.assets?.heroBackgroundImageUrl),
  };
}

export function compileThemeCssText(theme: ThemePreset, selector = ':root'): string {
  const variables = compileThemeCssVariables(theme);
  const declarations = Object.entries(variables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}

export function compileThemeStyleAttribute(theme: ThemePreset): Record<string, string> {
  return compileThemeCssVariables(theme);
}

export interface ThemeRuntimeSurface {
  className: string;
  style: Record<string, string>;
  dataAttributes: Record<string, string>;
}

export function createThemeRuntimeSurface(theme: ThemePreset): ThemeRuntimeSurface {
  return {
    className: `layout-${theme.layout.template}`,
    style: compileThemeStyleAttribute(theme),
    dataAttributes: {
      'data-layout-template': theme.layout.template,
      'data-nav-variant': theme.layout.nav,
      'data-nav-sticky': theme.layout.navSticky ? 'true' : 'false',
      'data-content-width': theme.layout.contentWidth,
      'data-hero-variant': theme.layout.hero,
      'data-section-rhythm': theme.layout.sectionRhythm,
      'data-section-border': theme.layout.sectionBorder,
      'data-card-style': theme.layout.cardStyle,
      'data-card-radius': theme.layout.cardRadius,
    },
  };
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function isWeight(weight: number): boolean {
  return Number.isInteger(weight) && weight >= 100 && weight <= 900;
}

function fontStack(fontName: string): string {
  return `'${fontName.replace(/'/g, "\\'")}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
}

function backgroundImageValue(url: string | undefined): string {
  return url?.trim() ? `url('${url.replace(/'/g, "\\'")}')` : 'none';
}

function contentMaxValue(width: ThemeContentWidth): string {
  switch (width) {
    case 'full':
      return 'none';
    case 'wide':
      return '1440px';
    case 'centered':
    default:
      return '1120px';
  }
}

function sectionGapValue(rhythm: ThemeSectionRhythm): string {
  switch (rhythm) {
    case 'none':
      return '0px';
    case 'compact':
      return '24px';
    case 'spacious':
    default:
      return '64px';
  }
}

function isCssLength(value: string): boolean {
  return /^0$|^-?\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%)$/.test(value.trim()) || /^clamp\(.+\)$/.test(value.trim()) || /^calc\(.+\)$/.test(value.trim());
}

function resolveSpacingValue(value: string | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

function sectionBorderWidthValue(border: ThemeSectionBorder): string {
  switch (border) {
    case 'thick':
      return '3px';
    case 'none':
      return '0px';
    case 'thin':
    default:
      return '1px';
  }
}

function cardShadow(style: ThemeCardStyle): string {
  switch (style) {
    case 'flat':
      return 'none';
    case 'brutalist':
      return '8px 8px 0 var(--color-border)';
    case 'glass':
      return '0 24px 80px rgb(0 0 0 / 0.24)';
    case 'soft-shadow':
      return '0 18px 60px rgb(15 23 42 / 0.08)';
  }
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function hexToRgb(hex: string): [number, number, number] {
  if (!hexColorPattern.test(hex)) return [0, 0, 0];
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)];
}
