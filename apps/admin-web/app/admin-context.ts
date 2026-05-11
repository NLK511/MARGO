import { moduleRegistry } from '@margo/modules';
import type { Permission, Role } from '@margo/core';
import { can } from '@margo/core';

export type DevTenantSlug = 'bistro-frontpage' | 'table-and-co' | 'oak-clinic';

export interface DevAdminSession {
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantSlug: DevTenantSlug;
  tenantName: string;
  enabledModules: string[];
  roles: Role[];
}

export const DEV_TENANTS: Record<DevTenantSlug, Omit<DevAdminSession, 'userId' | 'email' | 'displayName' | 'roles'>> = {
  'bistro-frontpage': {
    tenantId: 'demo-bistro-frontpage',
    tenantSlug: 'bistro-frontpage',
    tenantName: 'Bistro Lumiere',
    enabledModules: ['frontpage'],
  },
  'table-and-co': {
    tenantId: 'demo-table-and-co',
    tenantSlug: 'table-and-co',
    tenantName: 'Table & Co',
    enabledModules: ['frontpage', 'notifications', 'booking'],
  },
  'oak-clinic': {
    tenantId: 'demo-oak-clinic',
    tenantSlug: 'oak-clinic',
    tenantName: 'Oak Clinic',
    enabledModules: ['frontpage', 'notifications', 'booking', 'crm'],
  },
};

export const DEFAULT_DEV_SESSION: DevAdminSession = createDevSession('oak-clinic', ['tenant_owner']);

export function createDevSession(tenantSlug: DevTenantSlug, roles: Role[] = ['tenant_owner']): DevAdminSession {
  const tenant = DEV_TENANTS[tenantSlug];
  return {
    ...tenant,
    roles,
    userId: `dev-${tenantSlug}-owner`,
    email: `owner@${tenantSlug}.example`,
    displayName: `${tenant.tenantName} Owner`,
  };
}

export function parseDevSessionCookie(value?: string | null): DevAdminSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as { tenantSlug?: DevTenantSlug; roles?: Role[] };
    if (!parsed.tenantSlug || !DEV_TENANTS[parsed.tenantSlug]) return null;
    return createDevSession(parsed.tenantSlug, parsed.roles?.length ? parsed.roles : ['tenant_owner']);
  } catch {
    return null;
  }
}

export function serializeDevSessionCookie(input: { tenantSlug: DevTenantSlug; roles?: Role[] }): string {
  return encodeBase64Url(JSON.stringify({ tenantSlug: input.tenantSlug, roles: input.roles ?? ['tenant_owner'] }));
}

export function getAdminNavigation(session: Pick<DevAdminSession, 'enabledModules' | 'roles'>) {
  return moduleRegistry
    .enabledManifests(session.enabledModules)
    .flatMap((manifest) => manifest.menuItems)
    .filter((item) => !item.permission || can({ roles: session.roles }, item.permission as Permission));
}

export function getModuleSettings(session: Pick<DevAdminSession, 'enabledModules'>) {
  return moduleRegistry.manifests.map((manifest) => ({
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    enabled: session.enabledModules.includes(manifest.id),
    dependencies: manifest.dependencies,
  }));
}

export function routeModuleForPath(pathname: string): string | null {
  if (pathname === '/pages' || pathname.startsWith('/pages/')) return 'frontpage';
  if (pathname === '/bookings' || pathname.startsWith('/bookings/') || pathname.startsWith('/booking/')) return 'booking';
  if (pathname === '/customers' || pathname.startsWith('/customers/') || pathname.startsWith('/crm/')) return 'crm';
  return null;
}

export function isAdminRouteAllowed(pathname: string, session: Pick<DevAdminSession, 'enabledModules'>): boolean {
  const moduleId = routeModuleForPath(pathname);
  return !moduleId || session.enabledModules.includes(moduleId);
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}
