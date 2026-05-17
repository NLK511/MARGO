export const typeTokens = {
  caption: '12px',
  small: '14px',
  body: '16px',
  lead: '18px',
  h6: '20px',
  h5: '24px',
  h4: '30px',
  h3: '36px',
  h2: '48px',
  h1: '60px',
  display: '72px',
} as const;

export type TypeToken = keyof typeof typeTokens;
export type TypographyRole = 'display' | 'heading' | 'body' | 'label' | 'caption' | 'button';

export interface TypographyScale {
  display: TypeToken;
  heading: TypeToken;
  body: TypeToken;
  label: TypeToken;
  caption: TypeToken;
  button: TypeToken;
}

export const defaultTypographyScale: TypographyScale = {
  display: 'display',
  heading: 'h2',
  body: 'body',
  label: 'small',
  caption: 'caption',
  button: 'body',
};

export function resolveTypeToken(token: TypeToken): { token: TypeToken; size: string } {
  const size = typeTokens[token];
  if (!size) throw new Error(`Unknown type token: ${token}`);
  return { token, size };
}

export function isTypeToken(value: string): value is TypeToken {
  return value in typeTokens;
}
