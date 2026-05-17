import { describe, expect, it } from 'vitest';
import { parsePublicPageRoute } from './frontpage-data';

describe('public page route parsing', () => {
  it('parses locale home routes', () => {
    expect(parsePublicPageRoute('/en')).toEqual({ locale: 'en', pageSlug: 'home' });
  });

  it('parses locale page routes', () => {
    expect(parsePublicPageRoute('/fr/menu')).toEqual({ locale: 'fr', pageSlug: 'menu' });
  });

  it('ignores tenant dev prefixes', () => {
    expect(parsePublicPageRoute('/t/maison-noire')).toBeNull();
  });
});
