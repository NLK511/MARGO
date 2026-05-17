import { contrastRatio, type ThemePreset, validateThemePreset } from '@margo/themes';

type ColorIssuePath = `colors.${string}` | `typography.${string}Color`;

export interface ThemeColorIssue {
  fieldKey: string;
  path: ColorIssuePath;
  message: string;
  minimumContrast?: number;
  contrastAgainst?: string;
}

export interface ThemeColorSuggestion {
  id: string;
  title: string;
  description: string;
  value: string;
  contrast?: number;
}

const contrastIssueFields: Record<string, { contrastAgainst: (theme: ThemePreset) => string; minimumContrast: number }> = {
  text: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  primaryContrast: { contrastAgainst: (theme) => theme.colors.primary, minimumContrast: 3 },
  fontSansColor: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  fontDisplayColor: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  fontH1Color: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  fontH2Color: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  fontH3Color: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  fontBodyColor: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
  fontParagraphColor: { contrastAgainst: (theme) => theme.colors.bg, minimumContrast: 4.5 },
};

export function collectThemeColorIssues(theme: ThemePreset): ThemeColorIssue[] {
  const issues: ThemeColorIssue[] = [];

  for (const issue of validateThemePreset(theme)) {
    if (!issue.path.startsWith('colors.')) continue;
    const fieldKey = issue.path.slice('colors.'.length);
    issues.push({
      fieldKey,
      path: issue.path as ColorIssuePath,
      message: issue.message,
      ...getContrastRule(theme, fieldKey),
    });
  }

  for (const fieldKey of Object.keys(contrastIssueFields) as Array<keyof typeof contrastIssueFields>) {
    const value = theme.typography[fieldKey as keyof ThemePreset['typography']];
    if (typeof value !== 'string' || !value.trim()) continue;
    if (!isHexColor(value)) {
      issues.push({
        fieldKey,
        path: `typography.${fieldKey}` as ColorIssuePath,
        message: 'Color must be a 6-digit hex value.',
        ...getContrastRule(theme, fieldKey),
      });
      continue;
    }

    const rule = contrastIssueFields[fieldKey];
    if (!rule) continue;
    if (contrastRatio(value, rule.contrastAgainst(theme)) < rule.minimumContrast) {
      issues.push({
        fieldKey,
        path: `typography.${fieldKey}` as ColorIssuePath,
        message: `Color needs at least ${rule.minimumContrast}:1 contrast on background.`,
        contrastAgainst: rule.contrastAgainst(theme),
        minimumContrast: rule.minimumContrast,
      });
    }
  }

  return issues;
}

export function buildThemeColorSuggestions(input: {
  fieldKey: string;
  currentValue: string;
  fallbackValue: string;
  issue?: ThemeColorIssue;
}): ThemeColorSuggestion[] {
  const seed = parseHexColor(input.currentValue) ?? parseHexColor(input.fallbackValue) ?? '#10233A';
  const contrastAgainst = input.issue?.contrastAgainst;
  const minimumContrast = input.issue?.minimumContrast ?? 0;
  const target = contrastAgainst ? toneTarget(contrastAgainst) : toneTarget(seed);
  const candidates = generateCandidates(seed, target, contrastAgainst, minimumContrast);

  if (!candidates.length) return [];

  const [first, second] = pickTwoDistinctCandidates(candidates);
  return [
    {
      id: `${input.fieldKey}:${first}`,
      title: 'Closest safe match',
      description: suggestionDescription(first, contrastAgainst, minimumContrast),
      value: first,
      contrast: contrastAgainst ? contrastRatio(first, contrastAgainst) : undefined,
    },
    {
      id: `${input.fieldKey}:${second}`,
      title: 'Stronger safe alternative',
      description: suggestionDescription(second, contrastAgainst, minimumContrast),
      value: second,
      contrast: contrastAgainst ? contrastRatio(second, contrastAgainst) : undefined,
    },
  ];
}

function getContrastRule(theme: ThemePreset, fieldKey: string): Pick<ThemeColorIssue, 'contrastAgainst' | 'minimumContrast'> {
  const rule = contrastIssueFields[fieldKey];
  return rule ? { contrastAgainst: rule.contrastAgainst(theme), minimumContrast: rule.minimumContrast } : {};
}

function generateCandidates(seed: string, target: string, contrastAgainst?: string, minimumContrast = 0): string[] {
  const factors = [0.08, 0.14, 0.22, 0.3, 0.42, 0.56, 0.7, 0.84];
  const values: string[] = [];

  for (const factor of factors) {
    const candidate = mixHex(seed, target, factor);
    if (!contrastAgainst || contrastRatio(candidate, contrastAgainst) >= minimumContrast) {
      values.push(candidate);
    }
  }

  if (!values.length) {
    const fallback = mixHex(seed, target, 0.92);
    values.push(fallback);
  }

  return Array.from(new Set(values));
}

function pickTwoDistinctCandidates(candidates: string[]): [string, string] {
  const first = candidates[0]!;
  let second = candidates[candidates.length > 1 ? 1 : 0] ?? first;

  if (colorDistance(first, second) < 42) {
    for (const candidate of candidates) {
      if (candidate !== first && colorDistance(first, candidate) >= 42) {
        second = candidate;
        break;
      }
    }
  }

  if (second === first) {
    second = mixHex(first, toneTarget(first), 0.7);
  }

  if (colorDistance(first, second) < 42) {
    second = mixHex(first, toneTarget(second), 0.9);
  }

  return [first, second];
}

function suggestionDescription(value: string, contrastAgainst?: string, minimumContrast = 0): string {
  if (!contrastAgainst || !minimumContrast) return 'Valid hex color with a small tone shift.';
  return `${formatRatio(contrastRatio(value, contrastAgainst))} contrast on the chosen background.`;
}

function toneTarget(value: string): string {
  return relativeLuminance(value) > 0.5 ? '#000000' : '#FFFFFF';
}

function parseHexColor(value: string): string | null {
  const normalized = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(normalized)) {
    return `#${normalized.split('').map((character) => character + character).join('').toUpperCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(normalized)) {
    return `#${normalized.toUpperCase()}`;
  }
  return null;
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}){1,2}$/i.test(value.trim());
}

function mixHex(colorA: string, colorB: string, amount: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const mixed = {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount),
  };
  return rgbToHex(mixed);
}

function colorDistance(colorA: string, colorB: string): number {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = parseHexColor(hex) ?? '#10233A';
  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(color: { r: number; g: number; b: number }): string {
  const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function relativeLuminance(value: string): number {
  const { r, g, b } = hexToRgb(value);
  const normalized = [r, g, b].map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const [red, green, blue] = normalized;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function formatRatio(value: number): string {
  return `${value.toFixed(1)}:1`;
}
