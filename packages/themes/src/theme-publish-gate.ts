import { mergeTheme, themePresets, type ThemeOverrides, type ThemePreset, validateThemePreset } from './index';
import { toThemeFamily, toThemeRecipe, validateLegacyThemeOverrides } from './theme-migration';
import { validateThemeFamily } from './theme-family';
import { validateThemeRecipe } from './theme-recipe';

export interface ThemePublishIssue {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  path: string;
  suggestedFix?: string;
}

export interface ThemePublishGateInput {
  preset: ThemePreset;
  overrides?: ThemeOverrides;
}

export interface ThemePublishGateResult {
  issues: ThemePublishIssue[];
  blockingIssues: ThemePublishIssue[];
  canPublish: boolean;
}

export function evaluateThemePublishGate(input: ThemePublishGateInput): ThemePublishGateResult {
  const resolved = mergeTheme(input.preset, input.overrides ?? {});
  const family = toThemeFamily(resolved);
  const recipe = toThemeRecipe(resolved);

  const issues = [
    ...validateThemePreset(resolved).map((validationIssue) => createIssue('theme.preset.invalid', 'error', validationIssue.message, validationIssue.path, 'Fix the token value.')),
    ...validateThemeFamily(family).map((message) => createIssue('theme.family.invalid', 'error', message, 'family', 'Fix the theme family metadata.')),
    ...validateThemeRecipe(recipe).map((message) => createIssue('theme.recipe.invalid', 'error', message, 'recipe', 'Fix the theme recipe.')),
    ...validateLegacyThemeOverrides(input.overrides ?? {}).map((message) => createIssue('theme.overrides.invalid', 'error', message, 'overrides', 'Use object-shaped overrides.')),
  ];

  return {
    blockingIssues: issues.filter((designIssue) => designIssue.severity === 'error'),
    issues,
    canPublish: issues.every((designIssue) => designIssue.severity !== 'error'),
  };
}

export function evaluateBuiltInThemePublishGate(presetId: string): ThemePublishGateResult {
  const preset = themePresets.find((theme) => theme.id === presetId) ?? themePresets[0]!;
  return evaluateThemePublishGate({ preset });
}

function createIssue(
  code: string,
  severity: ThemePublishIssue['severity'],
  message: string,
  path: string,
  suggestedFix?: string,
): ThemePublishIssue {
  return { code, severity, message, path, suggestedFix };
}
