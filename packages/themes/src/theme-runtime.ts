import { compileThemeCssVariables, createThemeRuntimeSurface, getThemePreset, mergeTheme, type ThemeOverrides, type ThemePreset } from './index';
import { mapLegacyThemePreset, resolveThemePresetOrFallback } from './theme-migration';

export interface RuntimeTheme {
  themeFamilyId: string;
  themeVersionId: string;
  recipeId: string;
  cssVars: Record<string, string>;
  dataAttributes: Record<string, string>;
  typographyRoles: {
    display: string;
    heading: string;
    body: string;
    label: string;
    caption: string;
    button: string;
  };
  semanticColors: Record<string, string>;
  sectionRules: {
    rhythm: string;
    divider: string;
  };
}

export interface RuntimeThemeCacheStats {
  resolveHits: number;
  resolveMisses: number;
  cssHits: number;
  cssMisses: number;
}

const runtimeThemeCache = new Map<string, RuntimeTheme>();
const runtimeCssCache = new Map<string, Record<string, string>>();
let resolveHits = 0;
let resolveMisses = 0;
let cssHits = 0;
let cssMisses = 0;

export function resolveRuntimeTheme(input: { themePresetId?: string | null; themeOverrides?: ThemeOverrides }): RuntimeTheme {
  const cacheKey = createCacheKey(input.themePresetId, input.themeOverrides);
  const cached = runtimeThemeCache.get(cacheKey);
  if (cached) {
    resolveHits += 1;
    return cached;
  }

  resolveMisses += 1;
  const mapping = mapLegacyThemePreset(input.themePresetId);
  const theme = mergeTheme(resolveThemePresetOrFallback(input.themePresetId, (warning) => console.warn(warning)).preset, input.themeOverrides ?? {});
  const runtimeSurface = createThemeRuntimeSurface(theme);
  const runtimeTheme: RuntimeTheme = {
    themeFamilyId: mapping.family.id,
    themeVersionId: mapping.version.id,
    recipeId: mapping.version.recipeId,
    cssVars: compileRuntimeThemeVars(input),
    dataAttributes: runtimeSurface.dataAttributes,
    typographyRoles: {
      display: theme.typography.fontDisplay,
      heading: theme.typography.fontH1 ?? theme.typography.fontDisplay,
      body: theme.typography.fontBody ?? theme.typography.fontSans,
      label: theme.typography.fontSans,
      caption: theme.typography.fontSans,
      button: theme.typography.fontBody ?? theme.typography.fontSans,
    },
    semanticColors: {
      background: theme.colors.bg,
      surface: theme.colors.surface,
      surfaceRaised: theme.colors.surfaceAlt,
      textPrimary: theme.colors.text,
      textSecondary: theme.colors.textMuted,
      textTertiary: theme.colors.textMuted,
      borderSubtle: theme.colors.border,
      borderStrong: theme.colors.border,
      actionPrimary: theme.colors.primary,
      actionPrimaryText: theme.colors.primaryContrast,
      accent: theme.colors.accent,
      success: theme.colors.success,
      warning: theme.colors.warning,
      danger: theme.colors.danger,
    },
    sectionRules: {
      rhythm: theme.layout.sectionRhythm,
      divider: theme.layout.sectionBorder,
    },
  };

  runtimeThemeCache.set(cacheKey, runtimeTheme);
  return runtimeTheme;
}

export function compileRuntimeThemeVars(input: { themePresetId?: string | null; themeOverrides?: ThemeOverrides }): Record<string, string> {
  const cacheKey = createCacheKey(input.themePresetId, input.themeOverrides);
  const cached = runtimeCssCache.get(cacheKey);
  if (cached) {
    cssHits += 1;
    return cached;
  }

  cssMisses += 1;
  const theme = mergeTheme(resolveThemePresetOrFallback(input.themePresetId).preset, input.themeOverrides ?? {});
  const compiled = compileThemeCssVariables(theme);
  runtimeCssCache.set(cacheKey, compiled);
  return compiled;
}

export function fallbackRuntimeTheme(): ThemePreset {
  return getThemePreset(null);
}

export function getRuntimeThemeCacheStats(): RuntimeThemeCacheStats {
  return { resolveHits, resolveMisses, cssHits, cssMisses };
}

export function clearRuntimeThemeCache(): void {
  runtimeThemeCache.clear();
  runtimeCssCache.clear();
  resolveHits = 0;
  resolveMisses = 0;
  cssHits = 0;
  cssMisses = 0;
}

function createCacheKey(themePresetId: string | null | undefined, themeOverrides: ThemeOverrides | undefined): string {
  return `${normalizeKey(themePresetId)}::${stableStringify(themeOverrides ?? {})}`;
}

function normalizeKey(value: string | null | undefined): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'clinical-calm';
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeJsonValue(value));
}

function normalizeJsonValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => normalizeJsonValue(item));
  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = normalizeJsonValue((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}
