import { describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const mocks = vi.hoisted(() => ({
  update: vi.fn(async (args) => args),
  deleteMany: vi.fn(async (args) => args),
  createMany: vi.fn(async (args) => args),
}));

vi.mock('../../../../session', () => ({
  getCurrentDevSession: vi.fn(async () => ({ tenantSlug: 'chef', tenantId: 'tenant-1' })),
}));

vi.mock('../../../../admin-db', () => ({
  getAdminTenantRecord: vi.fn(async () => ({ tenantId: 'tenant-1', slug: 'chef' })),
}));

vi.mock('@margo/db', () => ({
  prisma: {
    publicPage: {
      findFirst: vi.fn(async ({ where }) => (where.OR?.some((item: { slug?: string }) => item.slug === 'home') ? { id: 'page-1', tenantId: 'tenant-1' } : null)),
      update: mocks.update,
    },
    pageBlock: {
      deleteMany: mocks.deleteMany,
      createMany: mocks.createMany,
    },
    $transaction: vi.fn(async (callback) => callback({ publicPage: { update: mocks.update }, pageBlock: { deleteMany: mocks.deleteMany, createMany: mocks.createMany } })),
  },
  syncDemoTenantSeedSnapshot: vi.fn(async () => undefined),
}));

describe('admin tenant page route', () => {
  it('updates pages resolved by slug fallback and preserves layout state', async () => {
    const response = await PATCH(
      new Request('http://admin.test/admin/tenant/pages/home', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Home',
          slug: 'home',
          seoTitle: 'Home',
          seoDescription: 'Homepage',
          status: 'draft',
          layoutPreset: 'editorial',
          blocks: [{ id: 'hero', type: 'hero', variant: 'split-image', props: {} }],
        }),
      }),
      { params: Promise.resolve({ pageId: 'home' }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.createMany).toHaveBeenCalled();
    expect(JSON.stringify(mocks.update.mock.calls[0]?.[0] ?? '')).toContain('editorial');
  });
});
