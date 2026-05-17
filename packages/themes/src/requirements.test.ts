import { describe, expect, it } from 'vitest';
import { mergeTheme, themePresets } from './index';
import { listThemeFamiliesFromPresets, mapLegacyThemePreset, toThemeFamily } from './theme-migration';
import { validateThemeFamily, validateThemeLifecycleTransition } from './theme-family';
import { validateThemeRecipe } from './theme-recipe';
import { evaluateBuiltInThemePublishGate, evaluateThemePublishGate } from './theme-publish-gate';
import { clearRuntimeThemeCache, getRuntimeThemeCacheStats, resolveRuntimeTheme } from './theme-runtime';

describe('theme requirements coverage', () => {
  it('keeps family, version, lifecycle, recipe, and migration models wired together', () => {
    const family = toThemeFamily(themePresets[0]);
    expect(validateThemeFamily(family)).toEqual([]);
    expect(validateThemeLifecycleTransition('draft', 'published')).toBeNull();
    expect(validateThemeLifecycleTransition('published', 'draft')).toContain('Cannot transition');
    expect(listThemeFamiliesFromPresets().length).toBeGreaterThan(0);
    expect(mapLegacyThemePreset('editorial-bistro').version.recipeId).toBe('editorial-bistro-recipe');
    expect(validateThemeRecipe({
      id: 'clinical-calm',
      name: 'Clinical Calm',
      personality: 'neutral',
      density: 'standard',
      typography: {
        display: 'display',
        heading: 'h2',
        body: 'body',
        label: 'small',
        caption: 'caption',
        button: 'body',
      },
      colors: { background: '#ffffff', surface: '#f8fafc', surfaceRaised: '#ffffff', textPrimary: '#111111', textSecondary: '#222222', textTertiary: '#333333', borderSubtle: '#dddddd', borderStrong: '#111111', actionPrimary: '#000000', actionPrimaryText: '#ffffff', accent: '#222222', success: '#0a0', warning: '#aa0', danger: '#a00' },
      radius: 'neutral',
      fontPairingId: 'Inter__Inter',
      imageTreatment: 'neutral',
      ctaTreatment: 'solid',
      sectionRules: { rhythm: 'standard', divider: 'thin' },
      componentStyles: { button: 'solid', card: 'soft-shadow', nav: 'top' },
    })).toEqual([]);
  });

  it('keeps publish gates and runtime fallback behavior safe', () => {
    const valid = evaluateBuiltInThemePublishGate('clinical-calm');
    expect(valid.canPublish).toBe(true);
    expect(valid.issues).toEqual([]);

    const invalid = evaluateThemePublishGate({ preset: mergeTheme(themePresets[0], { colors: { bg: 'blue' } }) });
    expect(invalid.canPublish).toBe(false);
    expect(invalid.blockingIssues[0]?.path).toContain('colors.bg');

    clearRuntimeThemeCache();
    resolveRuntimeTheme({ themePresetId: 'missing-theme' });
    expect(getRuntimeThemeCacheStats().resolveMisses).toBe(1);
  });

  it('keeps the preview matrix covered elsewhere in the design package', () => {
    expect(listThemeFamiliesFromPresets().map((family) => family.id)).toContain('clinical-calm');
  });
});
