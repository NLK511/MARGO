import { describe, expect, it } from 'vitest';
import { isSpaceToken, resolveSpaceToken, spaceTokens } from './space';

describe('space tokens', () => {
  it('exposes the canonical spacing scale', () => {
    expect(spaceTokens['space.0']).toBe('0px');
    expect(spaceTokens['space.8']).toBe('24px');
    expect(spaceTokens['space.15']).toBe('128px');
  });

  it('resolves space tokens', () => {
    expect(resolveSpaceToken('space.8')).toBe('24px');
    expect(isSpaceToken('space.9')).toBe(true);
    expect(isSpaceToken('space.999')).toBe(false);
  });
});
