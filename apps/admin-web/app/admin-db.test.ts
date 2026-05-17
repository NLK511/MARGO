import { describe, expect, it } from 'vitest';
import { buildAdminPageInventory } from './admin-db';

const tenant = {
  slug: 'maison-noire',
  enabledModules: ['frontpage', 'booking', 'notifications', 'quote-request'],
};

describe('admin page inventory', () => {
  it('splits manual pages from module-injected pages', () => {
    const inventory = buildAdminPageInventory(tenant, [
      { id: 'home', slug: 'home', locale: 'en', title: 'Homepage', status: 'published', seo: { title: 'Homepage' } },
    ]);

    expect(inventory.manualPages).toEqual([
      expect.objectContaining({ path: '/en', editable: true, source: 'manual' }),
    ]);
    expect(inventory.modulePages.map((page) => page.moduleId)).toEqual(['booking', 'booking', 'booking', 'quote-request', 'quote-request', 'quote-request', 'quote-request']);
    expect(inventory.modulePages.map((page) => page.path)).toContain('/booking');
    expect(inventory.modulePages.map((page) => page.path)).toContain('/t/maison-noire/quote-request/confirmation/:token');
    expect(inventory.modulePages.every((page) => page.editable === false)).toBe(true);
  });
});
