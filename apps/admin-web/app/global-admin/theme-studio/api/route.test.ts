import { describe, expect, it, vi } from 'vitest';
import { GET, PATCH, POST } from './route';

const mocks = vi.hoisted(() => ({
  session: {
    userId: 'u1',
    roles: ['global_admin'],
    tenantSlug: 'oak-clinic',
    enabledModules: [],
    tenantName: 'Oak Clinic',
    tenantId: 'tenant-1',
    displayName: 'Admin',
  } as { userId: string; roles: string[]; tenantSlug: string; enabledModules: string[]; tenantName: string; tenantId: string; displayName: string },
  record: vi.fn(async () => undefined),
  createThemeStudioFamily: vi.fn(async () => ({ id: 'studio-noir', name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining', lifecycle: 'draft' })),
  updateThemeStudioDraft: vi.fn(async () => ({ id: 'studio-noir', name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining', lifecycle: 'draft', description: 'Editorial luxury' })),
  transitionThemeStudioFamily: vi.fn(async () => ({ id: 'studio-noir', name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining', lifecycle: 'published' })),
  deleteThemeStudioFamily: vi.fn(async () => undefined),
  listThemeStudioFamilies: vi.fn(() => [{ id: 'clinical-calm', isBuiltIn: true }]),
}));

vi.mock('../../../session', () => ({ getCurrentDevSession: vi.fn(async () => mocks.session) }));
vi.mock('@margo/db', () => ({ createAuditLogService: vi.fn(() => ({ record: mocks.record })) }));
vi.mock('../theme-studio-store', () => ({
  createThemeStudioFamily: mocks.createThemeStudioFamily,
  updateThemeStudioDraft: mocks.updateThemeStudioDraft,
  transitionThemeStudioFamily: mocks.transitionThemeStudioFamily,
  deleteThemeStudioFamily: mocks.deleteThemeStudioFamily,
  listThemeStudioFamilies: mocks.listThemeStudioFamilies,
  ThemeStudioError: class ThemeStudioError extends Error {
    constructor(public readonly status: number, message: string) {
      super(message);
    }
  },
}));

describe('theme studio api route', () => {
  it('allows global admins and blocks tenant users', async () => {
    mocks.session.roles = ['global_admin'];
    expect((await GET()).status).toBe(200);

    mocks.session.roles = ['tenant_admin'];
    expect((await GET()).status).toBe(403);
  });

  it('creates, updates, and publishes draft families with audit logs', async () => {
    mocks.session.roles = ['global_admin'];

    await POST(new Request('http://admin.test/global-admin/theme-studio/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-family', name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining' }),
    }));

    await PATCH(new Request('http://admin.test/global-admin/theme-studio/api', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-draft', familyId: 'studio-noir', description: 'Editorial luxury' }),
    }));

    await PATCH(new Request('http://admin.test/global-admin/theme-studio/api', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transition', familyId: 'studio-noir', lifecycle: 'published' }),
    }));

    await PATCH(new Request('http://admin.test/global-admin/theme-studio/api', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-family', familyId: 'studio-noir' }),
    }));

    expect(mocks.createThemeStudioFamily).toHaveBeenCalledWith(expect.objectContaining({ name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining' }), undefined);
    expect(mocks.updateThemeStudioDraft).toHaveBeenCalledWith(expect.objectContaining({ familyId: 'studio-noir', description: 'Editorial luxury' }), undefined);
    expect(mocks.transitionThemeStudioFamily).toHaveBeenCalledWith(expect.objectContaining({ familyId: 'studio-noir', lifecycle: 'published' }), undefined);
    expect(mocks.deleteThemeStudioFamily).toHaveBeenCalledWith(expect.objectContaining({ familyId: 'studio-noir' }), undefined);
    expect(mocks.record).toHaveBeenCalled();
  });
});
