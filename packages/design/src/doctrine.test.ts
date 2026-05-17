import { describe, expect, it } from 'vitest';
import { doctrineStatements, listDoctrineStatements } from './doctrine';

describe('design doctrine', () => {
  it('exports all doctrine ids', () => {
    expect(Object.keys(doctrineStatements)).toEqual([
      'beautifulByDefault',
      'systemsBeforeSettings',
      'featureFirst',
      'personalityEncoded',
      'tenantChoosesOutcomes',
      'globalAdminOwnsSystems',
      'publishQualityGated',
    ]);
  });

  it('keeps titles and descriptions populated', () => {
    for (const doctrine of listDoctrineStatements()) {
      expect(doctrine.title).toBeTruthy();
      expect(doctrine.description).toBeTruthy();
    }
  });
});
