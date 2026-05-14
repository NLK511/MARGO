import { describe, expect, it } from 'vitest';
import { createDevSession, getAdminNavigation, getModuleSettings, getTenantAdminDemoData, isAdminRouteAllowed, parseDevSessionCookie, serializeDevSessionCookie } from './admin-context';

describe('admin dev auth and module guards', () => {
  it('round-trips the dev login cookie without losing tenant modules', () => {
    const cookie = serializeDevSessionCookie({ tenantSlug: 'table-and-co' });
    const session = parseDevSessionCookie(cookie);
    expect(session?.tenantName).toBe('Table & Co');
    expect(session?.enabledModules).toContain('booking');
    expect(session?.enabledModules).not.toContain('crm');
  });

  it('builds navigation from enabled modules and RBAC permissions', () => {
    const ownerNav = getAdminNavigation(createDevSession('oak-clinic')).map((item) => item.path);
    const providerNav = getAdminNavigation(createDevSession('oak-clinic', ['provider'])).map((item) => item.path);
    expect(ownerNav).toContain('/customers');
    expect(providerNav).toContain('/bookings');
    expect(providerNav).toContain('/customers');
    expect(providerNav).not.toContain('/pages');
  });

  it('blocks disabled module admin routes', () => {
    const frontpageOnly = createDevSession('bistro-frontpage');
    expect(isAdminRouteAllowed('/pages', frontpageOnly)).toBe(true);
    expect(isAdminRouteAllowed('/booking/services', frontpageOnly)).toBe(false);
    expect(isAdminRouteAllowed('/customers/demo', frontpageOnly)).toBe(false);
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
