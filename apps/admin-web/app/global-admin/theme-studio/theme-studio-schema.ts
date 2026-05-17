import { themePresets, type ThemeOverrides } from '@margo/themes';

export const lifecycleOptions = ['draft', 'qa', 'published', 'deprecated', 'archived'] as const;
export const colorFields = [
  ['bg', 'Background'],
  ['surface', 'Surface'],
  ['surfaceAlt', 'Surface alt'],
  ['text', 'Text'],
  ['textMuted', 'Text muted'],
  ['border', 'Border'],
  ['primary', 'Primary'],
  ['primaryContrast', 'Primary contrast'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['success', 'Success'],
  ['warning', 'Warning'],
  ['danger', 'Danger'],
] as const;
export const typographyFields = [
  ['fontSans', 'Sans font'],
  ['fontSerif', 'Serif font'],
  ['fontDisplay', 'Display font'],
  ['fontH1', 'H1 font'],
  ['fontH2', 'H2 font'],
  ['fontH3', 'H3 font'],
  ['fontBody', 'Body font'],
  ['fontParagraph', 'Paragraph font'],
] as const;
export const typographyColorFields = [
  ['fontSansColor', 'Sans color'],
  ['fontDisplayColor', 'Display color'],
  ['fontH1Color', 'H1 color'],
  ['fontH2Color', 'H2 color'],
  ['fontH3Color', 'H3 color'],
  ['fontBodyColor', 'Body color'],
  ['fontParagraphColor', 'Paragraph color'],
] as const;
export const layoutFields = [
  ['template', 'Template', ['classic', 'editorial', 'split', 'immersive'] as const],
  ['nav', 'Navigation', ['top', 'centered', 'minimal', 'overlay'] as const],
  ['hero', 'Hero', ['split-image', 'full-bleed', 'card-stack', 'brutalist'] as const],
  ['contentWidth', 'Content width', ['centered', 'wide', 'full'] as const],
  ['sectionRhythm', 'Section rhythm', ['none', 'compact', 'spacious'] as const],
  ['sectionBorder', 'Section border', ['thin', 'thick', 'none'] as const],
  ['cardStyle', 'Card style', ['soft-shadow', 'flat', 'brutalist', 'glass'] as const],
  ['cardRadius', 'Card radius', ['round', 'square'] as const],
] as const;
export const spacingFields = [
  ['pagePadding', 'Page padding'],
  ['sectionGap', 'Section gap'],
  ['cardPadding', 'Card padding'],
  ['heroPadding', 'Hero padding'],
  ['navGap', 'Navigation gap'],
  ['contentGap', 'Content gap'],
  ['blockGap', 'Block gap'],
] as const;
export const assetFields = [
  ['backgroundImageUrl', 'Background image URL'],
  ['cardBackgroundImageUrl', 'Card background image URL'],
  ['heroBackgroundImageUrl', 'Hero background image URL'],
] as const;

export function buildThemeFontOptions(): string[] {
  return Array.from(new Set(themePresets.flatMap((preset) => collectPresetFonts(preset))));
}

export function collectPresetFonts(preset: (typeof themePresets)[number]): string[] {
  const typography = preset.typography as {
    fontSans: string;
    fontSerif?: string;
    fontDisplay: string;
    fontH1?: string;
    fontH2?: string;
    fontH3?: string;
    fontBody?: string;
    fontParagraph?: string;
  };
  return [typography.fontSans, typography.fontSerif, typography.fontDisplay, typography.fontH1, typography.fontH2, typography.fontH3, typography.fontBody, typography.fontParagraph].filter((value): value is string => Boolean(value));
}

export function readThemeOverrides(formData: FormData): ThemeOverrides {
  return {
    colors: compactObject(readSection(formData, 'colors.', colorFields.map(([key]) => key))),
    typography: compactObject(readThemeTypography(formData)),
    layout: compactObject({
      ...readSection(formData, 'layout.', layoutFields.map(([key]) => key)),
      navSticky: booleanValue(formData.get('layout.navSticky')),
    }),
    assets: compactObject(readSection(formData, 'assets.', assetFields.map(([key]) => key))),
    spacing: compactObject(readSection(formData, 'spacing.', spacingFields.map(([key]) => key))),
  };
}

export function readThemeTypography(formData: FormData) {
  return {
    ...readSection(formData, 'typography.', typographyFields.map(([key]) => key)),
    headingWeight: numberValue(formData.get('typography.headingWeight')),
    bodyWeight: numberValue(formData.get('typography.bodyWeight')),
  };
}

export function readSection(formData: FormData, prefix: string, keys: readonly string[]) {
  return keys.reduce<Record<string, string>>((acc, key) => {
    const value = stringValue(formData.get(`${prefix}${key}`));
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});
}

export function stringValue(value: FormDataEntryValue | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export function booleanValue(value: FormDataEntryValue | null | undefined): boolean | undefined {
  const string = stringValue(value);
  if (string === undefined) return undefined;
  return string === 'true';
}

export function numberValue(value: FormDataEntryValue | null | undefined): number | undefined {
  const string = stringValue(value);
  if (string === undefined) return undefined;
  const parsed = Number(string);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeColor(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && /^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : '#10233A';
}

export function stringThemeValue(value: string | number | undefined): string {
  return value === undefined ? '' : String(value);
}
