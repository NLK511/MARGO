import { describe, expect, it } from 'vitest';
import {
  assertValidThemePreset,
  compileThemeCssText,
  compileThemeCssVariables,
  contrastRatio,
  getThemePreset,
  mergeTheme,
  themePresets,
  ThemeValidationError,
  validateThemePreset,
} from './index';

describe('theme presets', () => {
  it('defines the five MVP visual presets', () => {
    expect(themePresets.map((preset) => preset.id)).toEqual([
      'clinical-calm',
      'editorial-bistro',
      'organic-wellness',
      'neo-brutalist-local',
      'luxury-dark-dining',
    ]);
  });

  it('validates every shipped preset', () => {
    for (const preset of themePresets) {
      expect(validateThemePreset(preset)).toEqual([]);
    }
  });

  it('rejects invalid tokens', () => {
    const invalid = mergeTheme(themePresets[0], { colors: { bg: 'blue', text: '#FFFFFF' } });

    expect(validateThemePreset(invalid).map((issue) => issue.path)).toContain('colors.bg');
    expect(() => assertValidThemePreset(invalid)).toThrow(ThemeValidationError);
  });

  it('falls back to clinical calm for unknown preset ids', () => {
    expect(getThemePreset('missing').id).toBe('clinical-calm');
  });

  it('merges tenant overrides without mutating the preset', () => {
    const merged = mergeTheme(themePresets[1], { colors: { primary: '#111111' } });

    expect(merged.colors.primary).toBe('#111111');
    expect(themePresets[1].colors.primary).toBe('#8B3D1F');
  });
});

describe('theme CSS compiler', () => {
  it('compiles CSS variables for runtime application', () => {
    const variables = compileThemeCssVariables(themePresets[1]);

    expect(variables['--color-bg']).toBe('#F8F1E8');
    expect(variables['--font-display']).toContain('Cormorant Garamond');
    expect(variables['--shadow-card']).toBe('none');
  });

  it('compiles CSS text for server-rendered style tags', () => {
    expect(compileThemeCssText(themePresets[0], '[data-tenant-theme]')).toContain('[data-tenant-theme]');
    expect(compileThemeCssText(themePresets[0])).toContain('--color-primary: #2D7DD2;');
  });

  it('changes runtime theme variables without changing page content data', () => {
    const pageContent = { title: 'Reserve a table', body: 'Seasonal neighborhood dining.' };
    const bistroVariables = compileThemeCssVariables(themePresets[1]);
    const darkVariables = compileThemeCssVariables(themePresets[4]);

    expect(bistroVariables['--color-bg']).not.toBe(darkVariables['--color-bg']);
    expect(pageContent).toEqual({ title: 'Reserve a table', body: 'Seasonal neighborhood dining.' });
  });
});

describe('contrast checks', () => {
  it('keeps basic text and primary contrast accessible for presets', () => {
    for (const preset of themePresets) {
      expect(contrastRatio(preset.colors.text, preset.colors.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(preset.colors.primaryContrast, preset.colors.primary)).toBeGreaterThanOrEqual(3);
    }
  });
});
