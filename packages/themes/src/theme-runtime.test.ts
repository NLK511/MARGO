import { describe, expect, it } from 'vitest';
import { resolveRuntimeTheme, compileRuntimeThemeVars } from './theme-runtime';

describe('runtime theme model', () => {
  it('resolves runtime theme output from legacy preset ids', () => {
    const runtime = resolveRuntimeTheme({ themePresetId: 'editorial-bistro' });

    expect(runtime.themeFamilyId).toBe('editorial-bistro');
    expect(runtime.recipeId).toBe('editorial-bistro-recipe');
    expect(runtime.dataAttributes['data-layout-template']).toBe('editorial');
  });

  it('compiles runtime theme vars deterministically', () => {
    const first = compileRuntimeThemeVars({ themePresetId: 'clinical-calm' });
    const second = compileRuntimeThemeVars({ themePresetId: 'clinical-calm' });

    expect(first).toEqual(second);
    expect(first['--color-bg']).toBeTruthy();
  });
});
