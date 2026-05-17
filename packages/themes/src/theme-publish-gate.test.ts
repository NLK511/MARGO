import { describe, expect, it } from 'vitest';
import { mergeTheme, themePresets } from './index';
import { evaluateBuiltInThemePublishGate, evaluateThemePublishGate } from './theme-publish-gate';

describe('theme publish gate', () => {
  it('passes a valid built-in theme', () => {
    const result = evaluateBuiltInThemePublishGate('clinical-calm');
    expect(result.canPublish).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('blocks invalid themes with structured issues', () => {
    const invalid = mergeTheme(themePresets[0], { colors: { bg: 'blue' } });
    const result = evaluateThemePublishGate({ preset: invalid });

    expect(result.canPublish).toBe(false);
    expect(result.blockingIssues[0]?.path).toContain('colors.bg');
    expect(result.issues[0]?.code).toBe('theme.preset.invalid');
  });
});
