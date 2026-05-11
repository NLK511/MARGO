import { describe, expect, it } from 'vitest';
import { resolveTenantContext, brandedNotFound } from '../../packages/core/src';
import { evaluateModuleRouteAccess } from '../../packages/modules/src';
import { calculateAvailability, createBookingService, getCrmLabels } from '../../packages/db/src';

const tenants = {
  'bistro-frontpage': { tenantId: 'tenant-frontpage', slug: 'bistro-frontpage', displayName: 'Bistro Lumiere', enabledModules: ['frontpage'], locale: 'en', timezone: 'Europe/Paris', themePresetId: 'editorial-bistro' },
  'table-and-co': { tenantId: 'tenant-restaurant', slug: 'table-and-co', displayName: 'Table & Co', enabledModules: ['frontpage', 'notifications', 'booking'], locale: 'en', timezone: 'Europe/Paris', themePresetId: 'editorial-bistro' },
  'oak-clinic': { tenantId: 'tenant-clinic', slug: 'oak-clinic', displayName: 'Oak Clinic', enabledModules: ['frontpage', 'notifications', 'booking', 'crm'], locale: 'en', timezone: 'Europe/Paris', themePresetId: 'clinical-calm' },
};

describe('MVP E2E smoke model', () => {
  it('resolves all three seed tenant hostnames/slugs and hides disabled modules', async () => {
    const repository = { findByHostname: async () => null, findBySlug: async (slug: keyof typeof tenants) => tenants[slug] ?? null };
    const frontpage = await resolveTenantContext({ hostname: 'localhost:3000', path: '/t/bistro-frontpage' }, repository);
    const restaurant = await resolveTenantContext({ hostname: 'localhost:3000', path: '/t/table-and-co' }, repository);
    const clinic = await resolveTenantContext({ hostname: 'localhost:3000', path: '/t/oak-clinic' }, repository);

    expect(frontpage?.displayName).toBe('Bistro Lumiere');
    expect(evaluateModuleRouteAccess('booking', frontpage?.enabledModules ?? []).allowed).toBe(false);
    expect(evaluateModuleRouteAccess('booking', restaurant?.enabledModules ?? []).allowed).toBe(true);
    expect(evaluateModuleRouteAccess('crm', clinic?.enabledModules ?? []).allowed).toBe(true);
  });

  it('smokes restaurant and clinic booking creation paths', async () => {
    function mockClient() {
      const client = {
        $transaction: async (callback: (tx: unknown) => unknown) => callback(client),
        service: { findFirst: async () => ({ id: 'service', durationMinutes: 45 }) },
        booking: { findFirst: async () => null, create: async () => ({ id: 'booking', customerId: 'customer', publicToken: 'token' }), update: async () => ({}), findMany: async () => [] },
        customer: { findFirst: async () => null, create: async () => ({ id: 'customer' }), update: async () => ({ id: 'customer' }) },
        eventOutbox: { create: async () => ({}) },
        customerTimelineEvent: { create: async () => ({}) },
      };
      return client;
    }

    const restaurantSlots = calculateAvailability({ service: { id: 'dinner', durationMinutes: 90 }, resources: [{ id: 'table', active: true, capacity: 4 }], bookings: [], date: '2026-05-11', partySize: 2, businessHours: { opensAt: '18:00', closesAt: '20:00' } });
    const clinicSlots = calculateAvailability({ service: { id: 'consult', durationMinutes: 45 }, resources: [{ id: 'clinician', active: true }], bookings: [], date: '2026-05-11', businessHours: { opensAt: '09:00', closesAt: '10:00' } });

    await expect(createBookingService(mockClient() as never).createPublicBooking({ tenantId: 'tenant-restaurant', enabledModules: ['booking'], locationId: 'loc', serviceId: 'svc', resourceId: restaurantSlots[0]!.resourceId, startsAt: restaurantSlots[0]!.startsAt, customer: { displayName: 'Guest' }, idempotencyKey: 'rest' })).resolves.toHaveProperty('publicToken', 'token');
    await expect(createBookingService(mockClient() as never).createPublicBooking({ tenantId: 'tenant-clinic', enabledModules: ['booking', 'crm'], locationId: 'loc', serviceId: 'svc', resourceId: clinicSlots[0]!.resourceId, startsAt: clinicSlots[0]!.startsAt, customer: { displayName: 'Patient' }, idempotencyKey: 'clinic' })).resolves.toHaveProperty('publicToken', 'token');
    expect(getCrmLabels({ verticalType: 'clinic' }).singular).toBe('Patient');
  });

  it('uses branded empty/error state models for missing tenant pages', () => {
    expect(brandedNotFound(tenants['bistro-frontpage']).title).toContain('Bistro Lumiere');
  });
});
