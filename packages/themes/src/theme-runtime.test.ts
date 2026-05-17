import { describe, expect, it, vi, beforeEach } from 'vitest';
import { clearRuntimeThemeCache, compileRuntimeThemeVars, getRuntimeThemeCacheStats, resolveRuntimeTheme } from './theme-runtime';

describe('runtime theme model', () => {
  beforeEach(() => clearRuntimeThemeCache());
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

  it('reuses cached runtime theme output for repeated assignments', () => {
    resolveRuntimeTheme({ themePresetId: 'clinical-calm', themeOverrides: { layout: { navSticky: false } } });
    resolveRuntimeTheme({ themePresetId: 'clinical-calm', themeOverrides: { layout: { navSticky: false } } });
    compileRuntimeThemeVars({ themePresetId: 'clinical-calm', themeOverrides: { layout: { navSticky: false } } });
    compileRuntimeThemeVars({ themePresetId: 'clinical-calm', themeOverrides: { layout: { navSticky: false } } });

    const stats = getRuntimeThemeCacheStats();
    expect(stats).toMatchObject({ resolveMisses: 1, resolveHits: 1, cssMisses: 1 });
    expect(stats.cssHits).toBeGreaterThanOrEqual(1);
  });

  it('logs and falls back for unknown preset ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const runtime = resolveRuntimeTheme({ themePresetId: 'missing-theme' });

    expect(runtime.themeFamilyId).toBe('clinical-calm');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown theme preset "missing-theme"'));

    warn.mockRestore();
  });
});
