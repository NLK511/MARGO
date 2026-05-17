import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { themePresets } from './index';
import { resolveThemePresetWithStudioOverrides } from './theme-studio-overrides';

let createdDir: string | null = null;

afterEach(() => {
  if (createdDir) {
    rmSync(createdDir, { recursive: true, force: true });
    createdDir = null;
  }
});

describe('theme studio overrides', () => {
  it('applies saved built-in theme overrides before public rendering', () => {
    createdDir = mkdtempSync(join(tmpdir(), 'margo-theme-studio-'));
    mkdirSync(join(createdDir, '.margo'), { recursive: true });
    writeFileSync(
      join(createdDir, '.margo', 'theme-studio-state.json'),
      JSON.stringify({
        families: {
          chef: {
            sourcePresetId: 'chef',
            overrides: {
              colors: { primary: '#123456' },
              spacing: { pagePadding: '40px' },
            },
          },
        },
      }),
    );

    const theme = resolveThemePresetWithStudioOverrides('chef', undefined, createdDir);

    expect(theme.colors.primary).toBe('#123456');
    expect(theme.spacing?.pagePadding).toBe('40px');
    expect(theme.colors.text).toBe(themePresets.find((preset) => preset.id === 'chef')!.colors.text);
  });
});
