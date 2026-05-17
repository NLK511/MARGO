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

export function resolveRuntimeTheme(input: { themePresetId?: string | null; themeOverrides?: ThemeOverrides }): RuntimeTheme {
  const mapping = mapLegacyThemePreset(input.themePresetId);
  const theme = mergeTheme(resolveThemePresetOrFallback(input.themePresetId, (warning) => console.warn(warning)).preset, input.themeOverrides ?? {});
  const runtimeSurface = createThemeRuntimeSurface(theme);
  return {
    themeFamilyId: mapping.family.id,
    themeVersionId: mapping.version.id,
    recipeId: mapping.version.recipeId,
    cssVars: compileThemeCssVariables(theme),
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
}

export function compileRuntimeThemeVars(input: { themePresetId?: string | null; themeOverrides?: ThemeOverrides }): Record<string, string> {
  return resolveRuntimeTheme(input).cssVars;
}

export function fallbackRuntimeTheme(): ThemePreset {
  return getThemePreset(null);
}
