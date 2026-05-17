import { describe, expect, it, vi } from 'vitest';
import { PATCH } from './modules/route';

vi.mock('../session', () => ({ getCurrentDevSession: vi.fn(async () => ({ tenantSlug: 'maison-noire', roles: ['tenant_admin'], enabledModules: ['frontpage'] })) }));
vi.mock('../admin-db', () => ({
  getAdminTenantRecord: vi
    .fn()
    .mockResolvedValueOnce({ tenantId: 'tenant-1', slug: 'maison-noire', enabledModules: ['frontpage'] })
    .mockResolvedValueOnce({ tenantId: 'tenant-1', slug: 'maison-noire', enabledModules: ['frontpage', 'notifications', 'quote-request'] }),
  getModuleSettingsFromModules: vi.fn((enabledModules: string[]) => [
    { id: 'frontpage', name: 'Frontpage', description: '', dependencies: [], enabled: enabledModules.includes('frontpage') },
    { id: 'notifications', name: 'Notifications', description: '', dependencies: [], enabled: enabledModules.includes('notifications') },
    { id: 'quote-request', name: 'Quote Request', description: '', dependencies: ['notifications'], enabled: enabledModules.includes('quote-request') },
  ]),
}));

const upserts: unknown[] = [];
vi.mock('@margo/db', () => ({
  prisma: {
    tenantModule: {
      upsert: vi.fn((args) => {
        upserts.push(args);
        return args;
      }),
    },
    $transaction: vi.fn(async (queries) => queries),
  },
  syncDemoTenantSeedSnapshot: vi.fn(async () => undefined),
}));

describe('admin modules route', () => {
  it('enables required dependencies and returns updated module state', async () => {
    const response = await PATCH(new Request('http://admin.test/admin/modules', {
      method: 'PATCH',
      body: JSON.stringify({ moduleId: 'quote-request', enabled: true }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.enabledModules).toEqual(['frontpage', 'notifications', 'quote-request']);
    expect(upserts).toHaveLength(2);
    expect(JSON.stringify(upserts)).toContain('notifications');
    expect(JSON.stringify(upserts)).toContain('quote-request');
  });
});
