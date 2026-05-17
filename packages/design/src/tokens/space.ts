export const spaceTokens = {
  'space.0': '0px',
  'space.1': '2px',
  'space.2': '4px',
  'space.3': '6px',
  'space.4': '8px',
  'space.5': '12px',
  'space.6': '16px',
  'space.7': '20px',
  'space.8': '24px',
  'space.9': '32px',
  'space.10': '40px',
  'space.11': '48px',
  'space.12': '64px',
  'space.13': '80px',
  'space.14': '96px',
  'space.15': '128px',
} as const;

export type SpaceToken = keyof typeof spaceTokens;

export function resolveSpaceToken(token: SpaceToken): string {
  const value = spaceTokens[token];
  if (!value) throw new Error(`Unknown spacing token: ${token}`);
  return value;
}

export function isSpaceToken(value: string): value is SpaceToken {
  return value in spaceTokens;
}
