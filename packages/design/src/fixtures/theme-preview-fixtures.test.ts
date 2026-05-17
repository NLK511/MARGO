import { describe, expect, it } from 'vitest';
import { themePreviewFixtures } from './theme-preview-fixtures';

describe('theme preview fixtures', () => {
  it('contains the expected preview matrix', () => {
    expect(themePreviewFixtures.map((fixture) => fixture.id)).toEqual([
      'homepage',
      'booking',
      'service-list',
      'cta',
      'rich-text',
      'image-overlay',
      'mobile-nav',
      'empty-state',
      'form-state',
    ]);
  });
});
