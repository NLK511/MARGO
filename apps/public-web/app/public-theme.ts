import { getThemePreset, type ThemePreset } from '@margo/themes';

export async function resolvePublicThemePreset(themePresetId: string): Promise<ThemePreset> {
  const { resolveThemePresetWithStudioOverrides } = await import('@margo/themes/theme-studio-overrides');
  return resolveThemePresetWithStudioOverrides(themePresetId, (warning) => console.warn(warning));
}

export function getFallbackPublicThemePreset(themePresetId: string): ThemePreset {
  return getThemePreset(themePresetId);
}
