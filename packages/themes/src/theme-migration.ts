import type { ThemeOverrides, ThemePreset } from './index';
import { defaultThemePreset, mergeTheme, themePresets } from './index';
import type { ThemeFamily, ThemeVersion } from './theme-family';
import type { ThemeRecipe } from './theme-recipe';

export interface LegacyThemeMapping {
  family: ThemeFamily;
  version: ThemeVersion;
  recipe: ThemeRecipe;
  theme: ThemePreset;
}

export interface ResolvedThemePreset {
  preset: ThemePreset;
  requestedPresetId: string | null;
  usedFallback: boolean;
  warning?: string;
}

export function resolveThemePresetOrFallback(
  presetId: string | null | undefined,
  onFallback?: (warning: string) => void,
): ResolvedThemePreset {
  const requestedPresetId = typeof presetId === 'string' && presetId.trim() ? presetId : null;
  if (!requestedPresetId) {
    return { preset: defaultThemePreset, requestedPresetId: null, usedFallback: true };
  }

  const preset = themePresets.find((item) => item.id === requestedPresetId);
  if (preset) {
    return { preset, requestedPresetId, usedFallback: false };
  }

  const warning = `Unknown theme preset "${requestedPresetId}". Falling back to ${defaultThemePreset.id}.`;
  onFallback?.(warning);
  return { preset: defaultThemePreset, requestedPresetId, usedFallback: true, warning };
}

export function mapLegacyThemePreset(presetId: string | null | undefined, overrides: ThemeOverrides = {}): LegacyThemeMapping {
  const resolved = resolveThemePresetOrFallback(presetId);
  return {
    family: toThemeFamily(resolved.preset),
    version: toThemeVersion(resolved.preset),
    recipe: toThemeRecipe(resolved.preset),
    theme: mergeTheme(resolved.preset, overrides),
  };
}

export function toThemeFamily(preset: ThemePreset): ThemeFamily {
  return {
    id: preset.id,
    name: preset.name,
    verticalFit: ['generic'],
    personality: preset.typography.scale === 'editorial' ? 'soft' : preset.typography.scale === 'bold' ? 'playful' : 'neutral',
    versions: [toThemeVersion(preset)],
  };
}

export function toThemeVersion(preset: ThemePreset): ThemeVersion {
  return {
    id: `${preset.id}@1.0.0`,
    themeFamilyId: preset.id,
    version: '1.0.0',
    lifecycle: preset.id === defaultThemePreset.id ? 'published' : 'draft',
    recipeId: `${preset.id}-recipe`,
  };
}

export function toThemeRecipe(preset: ThemePreset): ThemeRecipe {
  const sectionRhythm = normalizeSectionRhythm(preset.layout.sectionRhythm);
  const semantic = {
    background: preset.colors.bg,
    surface: preset.colors.surface,
    surfaceRaised: preset.colors.surfaceAlt,
    textPrimary: preset.colors.text,
    textSecondary: preset.colors.textMuted,
    textTertiary: preset.colors.textMuted,
    borderSubtle: preset.colors.border,
    borderStrong: preset.colors.border,
    actionPrimary: preset.colors.primary,
    actionPrimaryText: preset.colors.primaryContrast,
    accent: preset.colors.accent,
    success: preset.colors.success,
    warning: preset.colors.warning,
    danger: preset.colors.danger,
  };

  return {
    id: `${preset.id}-recipe`,
    name: preset.name,
    personality: preset.typography.scale === 'editorial' ? 'soft' : preset.typography.scale === 'bold' ? 'playful' : 'neutral',
    density: sectionRhythm === 'compact' ? 'compact' : sectionRhythm === 'spacious' ? 'spacious' : 'standard',
    typography: {
      display: 'display',
      heading: preset.typography.scale === 'editorial' ? 'h1' : 'h2',
      body: 'body',
      label: 'small',
      caption: 'caption',
      button: 'body',
    },
    colors: semantic,
    radius: preset.layout.cardRadius === 'square' ? 'formal' : preset.layout.cardStyle === 'brutalist' ? 'formal' : 'soft',
    fontPairingId: `${preset.typography.fontSans}__${preset.typography.fontDisplay}`,
    imageTreatment: preset.layout.hero === 'full-bleed' ? 'high-contrast' : 'neutral',
    ctaTreatment: preset.layout.cardStyle === 'flat' ? 'outline' : 'solid',
    sectionRules: {
      rhythm: sectionRhythm,
      divider: preset.layout.sectionBorder === 'none' ? 'none' : preset.layout.sectionBorder,
    },
    componentStyles: {
      button: preset.layout.cardStyle === 'flat' ? 'outline' : 'solid',
      card: preset.layout.cardStyle,
      nav: preset.layout.nav,
    },
  };
}

export function validateLegacyThemeOverrides(overrides: ThemeOverrides): string[] {
  const errors: string[] = [];
  if (overrides.colors && !isObject(overrides.colors)) errors.push('colors must be an object');
  if (overrides.typography && !isObject(overrides.typography)) errors.push('typography must be an object');
  if (overrides.layout && !isObject(overrides.layout)) errors.push('layout must be an object');
  if (overrides.assets && !isObject(overrides.assets)) errors.push('assets must be an object');
  return errors;
}

export function listThemeFamiliesFromPresets(presets: readonly ThemePreset[] = themePresets): ThemeFamily[] {
  return presets.map((preset) => toThemeFamily(preset));
}

function normalizeSectionRhythm(rhythm: ThemePreset['layout']['sectionRhythm']): ThemeRecipe['sectionRules']['rhythm'] {
  return rhythm === 'none' || rhythm === 'compact' || rhythm === 'spacious' ? rhythm : 'standard';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
