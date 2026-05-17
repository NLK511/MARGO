import { describe, expect, it, vi } from 'vitest';

vi.mock('@margo/core', async () => {
  const actual = await vi.importActual<typeof import('@margo/core')>('@margo/core');
  return { ...actual, resolveTenantContext: vi.fn(async () => null) };
});

vi.mock('@margo/db', () => ({
  createPrismaTenantResolverRepository: vi.fn(() => ({})),
  createPublicPageService: vi.fn(() => ({ findPublishedPage: vi.fn(async () => null) })),
}));

import { getFrontpageForHostAndPath, parsePublicPageRoute } from './frontpage-data';

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

  it('falls back to the Maison Noire demo frontpage for local dev tenant routes', async () => {
    const model = await getFrontpageForHostAndPath('localhost:3000', '/t/maison-noire');

    expect(model?.tenant.slug).toBe('maison-noire');
    expect(model?.tenant.displayName).toBe('Maison Noire');
    expect(model?.page.title).toContain('exceptional evenings');
  });
});
