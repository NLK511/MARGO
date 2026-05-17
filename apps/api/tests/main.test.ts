import { describe, expect, it } from 'vitest';
import { getAdminMe, getAdminModules, getAdminTenant, getApiStatus, searchPublicAvailability } from '../src/main';
import type { AdminPrincipal, TenantContext } from '@margo/core';

const tenant: TenantContext = {
  tenantId: 'tenant-1',
  slug: 'oak-clinic',
  displayName: 'Oak Clinic',
  enabledModules: ['frontpage', 'notifications', 'booking', 'crm'],
  locale: 'en',
  timezone: 'Europe/Paris',
  themePresetId: 'clinical-calm',
};

const owner: AdminPrincipal = { userId: 'user-1', tenantId: 'tenant-1', roles: ['tenant_owner'] };

describe('api bootstrap', () => {
  it('reports ready status', () => {
    expect(getApiStatus()).toMatchObject({ service: 'margo-api', status: 'ready' });
  });

  it('exposes admin me, tenant, and module settings helpers', () => {
    expect(getAdminMe({ principal: owner, tenant }).permissions).toContain('owner.dashboard.read');
    expect(getAdminMe({ principal: owner, tenant }).permissions).not.toContain('tenant.modules.manage');
    expect(getAdminTenant({ principal: owner, tenant })).toMatchObject({ slug: 'oak-clinic', displayName: 'Oak Clinic' });
    expect(getAdminModules({ principal: owner, tenant }).map((module) => module.id)).toEqual(['frontpage', 'notifications', 'booking', 'crm']);
    expect(getAdminModules({ principal: owner, tenant }).find((module) => module.id === 'booking')?.menuItems).toHaveLength(1);
  });

  it('denies admin APIs for another tenant', () => {
    expect(() => getAdminMe({ principal: { ...owner, tenantId: 'other-tenant' }, tenant })).toThrow('Principal cannot access this tenant.');
  });

  it('exposes public availability search', () => {
    const result = searchPublicAvailability({
      service: { id: 'service', durationMinutes: 30 },
      resources: [{ id: 'resource', active: true, capacity: 2 }],
      bookings: [],
      date: '2026-05-11',
      businessHours: { opensAt: '09:00', closesAt: '10:00' },
    });

    expect(result.slots).toHaveLength(2);
  });
});
