import { describe, expect, it } from 'vitest';
import { createDevSession, getAdminNavigation, getModuleSettings, getSurfaceNavigation, getTenantAdminDemoData, isAdminRouteAllowed, isSurfaceAllowed, parseDevSessionCookie, serializeDevSessionCookie } from './admin-context';

describe('admin dev auth and module guards', () => {
  it('round-trips the dev login cookie without losing tenant modules', () => {
    const cookie = serializeDevSessionCookie({ tenantSlug: 'table-and-co', enabledModules: ['frontpage', 'booking'] });
    const session = parseDevSessionCookie(cookie);
    expect(session?.tenantName).toBe('Table & Co');
    expect(session?.enabledModules).toEqual(['frontpage', 'booking']);
  });

  it('builds navigation from enabled modules and RBAC permissions', () => {
    const ownerNav = getAdminNavigation(createDevSession('oak-clinic')).map((item) => item.path);
    const providerNav = getAdminNavigation(createDevSession('oak-clinic', ['provider'])).map((item) => item.path);
    const tenantAdminNav = getSurfaceNavigation('tenant', createDevSession('oak-clinic', ['tenant_admin'])).map((item) => item.path);
    expect(ownerNav).toContain('/owner/customers');
    expect(providerNav).toContain('/owner/bookings');
    expect(providerNav).toContain('/owner/customers');
    expect(providerNav).not.toContain('/tenant/pages');
    expect(tenantAdminNav).toContain('/tenant/theme');
    expect(tenantAdminNav).toContain('/tenant/modules');
    expect(tenantAdminNav).toContain('/tenant/pages');
  });

  it('blocks disabled module admin routes', () => {
    const frontpageOnly = createDevSession('bistro-frontpage');
    expect(isAdminRouteAllowed('/tenant/pages', createDevSession('bistro-frontpage', ['tenant_admin']))).toBe(true);
    expect(isAdminRouteAllowed('/tenant/booking/services', createDevSession('bistro-frontpage', ['tenant_admin']))).toBe(false);
    expect(isAdminRouteAllowed('/owner/customers/demo', frontpageOnly)).toBe(false);
  });

  it('keeps global studio, tenant builder, and owner portal roles separate', () => {
    expect(isSurfaceAllowed('global-admin', createDevSession('oak-clinic', ['global_admin']))).toBe(true);
    expect(isSurfaceAllowed('global-admin', createDevSession('oak-clinic', ['tenant_admin']))).toBe(false);
    expect(isSurfaceAllowed('tenant', createDevSession('oak-clinic', ['tenant_admin']))).toBe(true);
    expect(isSurfaceAllowed('tenant', createDevSession('oak-clinic', ['tenant_owner']))).toBe(false);
    expect(isSurfaceAllowed('owner', createDevSession('oak-clinic', ['tenant_owner']))).toBe(true);
  });

  it('exposes read-only module settings', () => {
    const settings = getModuleSettings(createDevSession('table-and-co'));
    expect(settings.find((module) => module.id === 'booking')?.enabled).toBe(true);
    expect(settings.find((module) => module.id === 'crm')?.enabled).toBe(false);
  });

  it('keeps demo admin data strictly scoped to the signed-in tenant', () => {
    const clinicData = getTenantAdminDemoData(createDevSession('oak-clinic'));
    const restaurantData = getTenantAdminDemoData(createDevSession('table-and-co'));

    expect(clinicData.bookings.map((booking) => booking.service)).toEqual(['Initial consultation']);
    expect(clinicData.bookings.map((booking) => booking.service)).not.toContain('Dinner reservation');
    expect(restaurantData.customers).toEqual([]);
    expect(restaurantData.resources.map((resource) => resource.name)).not.toContain('Dr. Ada Martin');
  });
});
