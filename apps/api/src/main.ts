import { calculateAvailability, createBookingService, createCrmService } from '@margo/db';
import { can, guardAdminPermission } from '@margo/core';
import type { AdminPrincipal, Permission, TenantContext } from '@margo/core';
import { moduleRegistry } from '@margo/modules';
import type { AvailabilityServiceInput, PublicBookingInput } from '@margo/db';

export function getApiStatus() {
  return {
    service: 'margo-api',
    status: 'ready',
    routes: ['/api/v1/public/availability', '/api/v1/public/bookings', '/api/v1/admin/bookings', '/api/v1/admin/customers', '/api/v1/admin/me', '/api/v1/admin/tenant', '/api/v1/admin/modules'],
  } as const;
}

export function searchPublicAvailability(input: AvailabilityServiceInput) {
  return { slots: calculateAvailability(input) };
}

export function createPublicBooking(input: PublicBookingInput) {
  return createBookingService().createPublicBooking(input);
}

export function searchAdminCustomers(input: { tenantId: string; query?: string }) {
  return createCrmService().searchCustomers(input);
}

export function getAdminCustomerProfile(input: { tenantId: string; customerId: string }) {
  return createCrmService().getCustomerProfile(input);
}

export function createAdminCustomerNote(input: { tenantId: string; customerId: string; body: string; authorUserId?: string | null }) {
  return createCrmService().addCustomerNote(input);
}

export function getAdminMe(input: { principal: AdminPrincipal | null; tenant: Pick<TenantContext, 'tenantId'> }) {
  const principal = guardAdminPermission({ principal: input.principal, tenant: input.tenant, permission: 'site.pages.read' });
  return {
    userId: principal.userId,
    tenantId: principal.tenantId,
    roles: principal.roles,
    permissions: getPrincipalPermissions(principal),
  };
}

export function getAdminTenant(input: { principal: AdminPrincipal | null; tenant: TenantContext }) {
  guardAdminPermission({ principal: input.principal, tenant: input.tenant, permission: 'site.pages.read' });
  return {
    tenantId: input.tenant.tenantId,
    slug: input.tenant.slug,
    displayName: input.tenant.displayName,
    locale: input.tenant.locale,
    timezone: input.tenant.timezone,
    themePresetId: input.tenant.themePresetId,
  };
}

export function getAdminModules(input: { principal: AdminPrincipal | null; tenant: TenantContext }) {
  const principal = guardAdminPermission({ principal: input.principal, tenant: input.tenant, permission: 'site.pages.read' });
  return moduleRegistry.enabledManifests(input.tenant.enabledModules).map((manifest) => ({
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    menuItems: manifest.menuItems.filter((item) => !item.permission || can(principal, item.permission as Permission)),
  }));
}

function getPrincipalPermissions(principal: AdminPrincipal): Permission[] {
  const permissions: Permission[] = ['site.pages.read', 'site.pages.write', 'booking.read', 'booking.write', 'booking.cancel', 'crm.customer.read', 'crm.customer.write', 'crm.note.write', 'tenant.billing.manage', 'tenant.modules.manage'];
  return permissions.filter((permission) => can(principal, permission));
}

if (process.env.NODE_ENV !== 'test') {
  console.log(getApiStatus());
}
