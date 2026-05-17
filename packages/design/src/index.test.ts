import { describe, expect, it } from 'vitest';
import { doctrineStatements, spaceTokens, typeTokens } from './index';

describe('@margo/design', () => {
  it('exports doctrine and token registries', () => {
    expect(doctrineStatements.beautifulByDefault.id).toBe('beautifulByDefault');
    expect(spaceTokens['space.8']).toBe('24px');
    expect(typeTokens.body).toBe('16px');
  });
});
