export type SemanticColorToken =
  | 'background'
  | 'surface'
  | 'surfaceRaised'
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'borderSubtle'
  | 'borderStrong'
  | 'actionPrimary'
  | 'actionPrimaryText'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export function hsl(h: number, s: number, l: number): HslColor {
  return { h, s, l };
}

export function toHslCss(color: HslColor): string {
  return `hsl(${color.h} ${color.s}% ${color.l}%)`;
}

export function buildShadeRamp(base: HslColor): Record<number, string> {
  return {
    50: toHslCss({ ...base, l: Math.min(98, base.l + 30) }),
    100: toHslCss({ ...base, l: Math.min(96, base.l + 24) }),
    200: toHslCss({ ...base, l: Math.min(90, base.l + 16) }),
    300: toHslCss({ ...base, l: Math.min(82, base.l + 8) }),
    400: toHslCss(base),
    500: toHslCss({ ...base, l: Math.max(0, base.l - 8) }),
    600: toHslCss({ ...base, l: Math.max(0, base.l - 16) }),
    700: toHslCss({ ...base, l: Math.max(0, base.l - 24) }),
    800: toHslCss({ ...base, l: Math.max(0, base.l - 32) }),
    900: toHslCss({ ...base, l: Math.max(0, base.l - 40) }),
  };
}

export interface SemanticColorScheme {
  background: string;
  surface: string;
  surfaceRaised: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderSubtle: string;
  borderStrong: string;
  actionPrimary: string;
  actionPrimaryText: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
}

export function compileSemanticColors(input: Partial<SemanticColorScheme> & { base?: HslColor }): SemanticColorScheme {
  const base = input.base ?? hsl(222, 55, 12);
  const ramp = buildShadeRamp(base);
  const background = input.background ?? ramp[50]!;
  const surface = input.surface ?? ramp[100]!;
  const surfaceRaised = input.surfaceRaised ?? ramp[50]!;
  const textPrimary = input.textPrimary ?? ramp[900]!;
  const textSecondary = input.textSecondary ?? ramp[700]!;
  const textTertiary = input.textTertiary ?? ramp[600]!;
  const borderSubtle = input.borderSubtle ?? ramp[200]!;
  const borderStrong = input.borderStrong ?? ramp[300]!;
  const actionPrimary = input.actionPrimary ?? ramp[500]!;
  const actionPrimaryText = input.actionPrimaryText ?? '#ffffff';
  const accent = input.accent ?? ramp[400]!;
  const success = input.success ?? 'hsl(142 60% 35%)';
  const warning = input.warning ?? 'hsl(38 95% 48%)';
  const danger = input.danger ?? 'hsl(0 72% 52%)';

  return {
    background,
    surface,
    surfaceRaised,
    textPrimary,
    textSecondary,
    textTertiary,
    borderSubtle,
    borderStrong,
    actionPrimary,
    actionPrimaryText,
    accent,
    success,
    warning,
    danger,
  };
}
