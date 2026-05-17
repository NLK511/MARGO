export const elevationTokens = {
  none: 'none',
  low: '0 4px 12px rgb(15 23 42 / 0.08)',
  medium: '0 10px 28px rgb(15 23 42 / 0.12)',
  high: '0 18px 44px rgb(15 23 42 / 0.16)',
  floating: '0 30px 60px rgb(15 23 42 / 0.20)',
} as const;

export type ElevationToken = keyof typeof elevationTokens;
