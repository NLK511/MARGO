import { describe, expect, it } from 'vitest';
import { themePresets } from './index';
import { listThemeFamiliesFromPresets, mapLegacyThemePreset, toThemeFamily, validateLegacyThemeOverrides } from './theme-migration';
import { validateThemeFamily, validateThemeLifecycleTransition } from './theme-family';

describe('theme family model', () => {
  it('creates valid theme families from shipped presets', () => {
    const family = toThemeFamily(themePresets[0]);
    expect(validateThemeFamily(family)).toEqual([]);
    expect(family.versions[0]?.lifecycle).toBe('published');
  });

  it('validates lifecycle transitions', () => {
    expect(validateThemeLifecycleTransition('draft', 'published')).toBeNull();
    expect(validateThemeLifecycleTransition('published', 'draft')).toContain('Cannot transition');
  });

  it('lists theme families for all built-in presets', () => {
    expect(listThemeFamiliesFromPresets().map((family) => family.id)).toEqual(themePresets.map((preset) => preset.id));
  });

  it('maps legacy presets to runtime family/version/recipe data', () => {
    const mapping = mapLegacyThemePreset('editorial-bistro');
    expect(mapping.family.id).toBe('editorial-bistro');
    expect(mapping.version.recipeId).toBe('editorial-bistro-recipe');
    expect(mapping.theme.id).toBe('editorial-bistro');
  });

  it('accepts object-shaped legacy overrides', () => {
    expect(validateLegacyThemeOverrides({ colors: { primary: '#111111' } })).toEqual([]);
    expect(validateLegacyThemeOverrides({ colors: 'nope' as never })).toContain('colors must be an object');
  });
});
