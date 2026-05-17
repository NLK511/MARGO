import { describe, expect, it } from 'vitest';
import { mergeTheme, themePresets, contrastRatio } from '@margo/themes';
import { buildThemeColorSuggestions, collectThemeColorIssues } from './theme-studio-color-suggestions';

describe('theme studio color suggestions', () => {
  it('suggests two distinct accessible replacements for contrast issues', () => {
    const theme = mergeTheme(themePresets[0], { colors: { text: '#9B9B9B' } });
    const issue = collectThemeColorIssues(theme).find((entry) => entry.fieldKey === 'text');

    expect(issue).toBeTruthy();

    const suggestions = buildThemeColorSuggestions({
      fieldKey: 'text',
      currentValue: theme.colors.text,
      fallbackValue: themePresets[0].colors.text,
      issue,
    });

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]!.value).not.toBe(suggestions[1]!.value);
    expect(contrastRatio(suggestions[0]!.value, theme.colors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(suggestions[1]!.value, theme.colors.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('flags invalid typography color values', () => {
    const theme = mergeTheme(themePresets[0], { typography: { fontBodyColor: 'not-a-color' as never } });
    const issues = collectThemeColorIssues(theme);

    expect(issues.some((issue) => issue.fieldKey === 'fontBodyColor')).toBe(true);
  });
});
