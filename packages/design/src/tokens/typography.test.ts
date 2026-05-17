import { describe, expect, it } from 'vitest';
import { defaultTypographyScale, isTypeToken, resolveTypeToken, typeTokens } from './typography';

describe('typography tokens', () => {
  it('exposes the canonical type scale', () => {
    expect(typeTokens.body).toBe('16px');
    expect(typeTokens.h1).toBe('60px');
    expect(typeTokens.display).toBe('72px');
  });

  it('resolves type tokens', () => {
    expect(resolveTypeToken('body')).toEqual({ token: 'body', size: '16px' });
    expect(defaultTypographyScale.heading).toBe('h2');
    expect(isTypeToken('h3')).toBe(true);
    expect(isTypeToken('unknown')).toBe(false);
  });
});
