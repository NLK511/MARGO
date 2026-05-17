import { can, DEMO_TENANTS, type DemoTenantSlug, type Permission, type Role } from '@margo/core';
import { moduleRegistry } from '@margo/modules';

export type DevTenantSlug = DemoTenantSlug;

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

export const DEV_TENANTS: Record<DevTenantSlug, Omit<DevAdminSession, 'userId' | 'email' | 'displayName' | 'roles'>> = Object.fromEntries(
  Object.values(DEMO_TENANTS).map((tenant) => [tenant.slug, {
    tenantId: `demo-${tenant.slug}`,
    tenantSlug: tenant.slug,
    tenantName: tenant.tenantName,
    enabledModules: tenant.enabledModules,
  }]),
) as Record<DevTenantSlug, Omit<DevAdminSession, 'userId' | 'email' | 'displayName' | 'roles'>>;

export type AdminSurface = 'global-admin' | 'tenant' | 'owner';

export const DEFAULT_DEV_SESSION: DevAdminSession = createDevSession('oak-clinic', ['tenant_owner']);

export function createDevSession(tenantSlug: DevTenantSlug, roles: Role[] = ['tenant_owner'], enabledModules?: string[]): DevAdminSession {
  const tenant = DEV_TENANTS[tenantSlug];
  return {
    ...tenant,
    enabledModules: enabledModules ?? tenant.enabledModules,
    roles,
    userId: `dev-${tenantSlug}-owner`,
    email: `owner@${tenantSlug}.example`,
    displayName: `${tenant.tenantName} Owner`,
  };
}

export function parseDevSessionCookie(value?: string | null): DevAdminSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as { tenantSlug?: DevTenantSlug; roles?: Role[]; enabledModules?: string[] };
    if (!parsed.tenantSlug || !DEV_TENANTS[parsed.tenantSlug]) return null;
    return createDevSession(
      parsed.tenantSlug,
      parsed.roles?.length ? parsed.roles : ['tenant_owner'],
      Array.isArray(parsed.enabledModules) ? parsed.enabledModules : undefined,
    );
  } catch {
    return null;
  }
}

export function serializeDevSessionCookie(input: { tenantSlug: DevTenantSlug; roles?: Role[]; enabledModules?: string[] }): string {
  return encodeBase64Url(
    JSON.stringify({ tenantSlug: input.tenantSlug, roles: input.roles ?? ['tenant_owner'], enabledModules: input.enabledModules }),
  );
}

export function getAdminNavigation(session: Pick<DevAdminSession, 'enabledModules' | 'roles'>) {
  return getSurfaceNavigation('owner', session);
}

export function getSurfaceNavigation(surface: AdminSurface, session: Pick<DevAdminSession, 'enabledModules' | 'roles'>) {
  const staticItems = getStaticSurfaceNavigation(surface, session.roles);
  const moduleItems = moduleRegistry
    .enabledManifests(session.enabledModules)
    .flatMap((manifest) => {
      if (surface === 'tenant') {
        return manifest.adminRoutes.length || manifest.id === 'frontpage' ? manifest.menuItems.filter((item) => item.path.startsWith('/tenant')) : [];
      }
      if (surface === 'owner') {
        return manifest.menuItems.filter((item) => item.path.startsWith('/owner'));
      }
      return [];
    })
    .filter((item) => !item.permission || can({ roles: session.roles }, item.permission as Permission));
  return [...staticItems, ...moduleItems];
}

function getStaticSurfaceNavigation(surface: AdminSurface, roles: Role[]) {
  const canUse = (permission: Permission) => can({ roles }, permission);
  if (surface === 'global-admin') {
    return canUse('platform.tenants.read')
      ? [
          { label: 'Tenants', path: '/global-admin' },
          { label: 'Templates', path: '/global-admin/templates', permission: 'platform.templates.manage' },
          { label: 'Theme studio', path: '/global-admin/theme-studio', permission: 'platform.themes.manage' },
          { label: 'Themes', path: '/global-admin/themes', permission: 'platform.themes.manage' },
        ].filter((item) => !item.permission || canUse(item.permission as Permission))
      : [];
  }
  if (surface === 'tenant') {
    return canUse('tenant.builder.read')
      ? [
          { label: 'Builder home', path: '/tenant' },
          { label: 'Theme', path: '/tenant/theme', permission: 'tenant.builder.write' },
          { label: 'Modules', path: '/tenant/modules', permission: 'tenant.modules.manage' },
        ].filter((item) => !item.permission || canUse(item.permission as Permission))
      : [];
  }
  return canUse('owner.dashboard.read') ? [{ label: 'Owner home', path: '/owner' }] : [];
}

export interface TenantAdminDemoData {
  pages: Array<{ id: string; title: string; slug: string; status: 'draft' | 'published'; seoTitle: string; seoDescription: string }>;
  services: Array<{ slug: string; name: string; duration: number; status: string }>;
  resources: Array<{ name: string; type: string; capacity: string | number; status: string }>;
  bookings: Array<{ id: string; customer: string; service: string; time: string; status: string }>;
  customers: Array<{ id: string; name: string; email: string; phone: string; updated: string }>;
  customFields: Array<{ key: string; label: string; type: string; required: string }>;
}

export const TENANT_ADMIN_DEMO_DATA: Record<DevTenantSlug, TenantAdminDemoData> = {
  'bistro-frontpage': {
    pages: [
      { id: 'home', title: 'Bistro homepage', slug: 'home', status: 'published', seoTitle: 'Seasonal neighborhood dining', seoDescription: 'Warm, seasonal cooking in the heart of the city.' },
    ],
    services: [],
    resources: [],
    bookings: [],
    customers: [],
    customFields: [],
  },
  'table-and-co': {
    pages: [
      { id: 'home', title: 'Table & Co homepage', slug: 'home', status: 'published', seoTitle: 'Reserve a table at Table & Co', seoDescription: 'Restaurant demo tenant with public reservations.' },
    ],
    services: [
      { slug: 'dinner-reservation', name: 'Dinner reservation', duration: 90, status: 'active' },
      { slug: 'lunch-reservation', name: 'Lunch reservation', duration: 75, status: 'active' },
    ],
    resources: [
      { name: 'Table 1', type: 'table', capacity: 2, status: 'active' },
      { name: 'Table 2', type: 'table', capacity: 4, status: 'active' },
      { name: 'Table 3', type: 'table', capacity: 6, status: 'active' },
    ],
    bookings: [
      { id: 'bk_table_and_co', customer: 'Demo Guest', service: 'Dinner reservation', time: '18:00', status: 'confirmed' },
    ],
    customers: [],
    customFields: [],
  },
  'maison-noire': {
    pages: [
      { id: 'home', title: 'Maison Noire homepage', slug: 'home', status: 'published', seoTitle: 'An intimate dining room for exceptional evenings', seoDescription: 'Luxury restaurant demo tenant with elegant reservations and immersive visual styling.' },
    ],
    services: [
      { slug: 'tasting-menu', name: 'Chef tasting menu', duration: 120, status: 'active' },
      { slug: 'private-salon', name: 'Private salon dinner', duration: 150, status: 'active' },
    ],
    resources: [
      { name: 'Salon A', type: 'table', capacity: 4, status: 'active' },
      { name: 'Salon B', type: 'table', capacity: 6, status: 'active' },
      { name: 'Chef’s Table', type: 'table', capacity: 8, status: 'active' },
    ],
    bookings: [
      { id: 'bk_maison_noire', customer: 'Private Guest', service: 'Chef tasting menu', time: '20:00', status: 'confirmed' },
    ],
    customers: [],
    customFields: [],
  },
  'oak-clinic': {
    pages: [
      { id: 'home', title: 'Oak Clinic homepage', slug: 'home', status: 'published', seoTitle: 'Calm care for every patient', seoDescription: 'Clinic demo tenant with appointments and patient CRM.' },
    ],
    services: [
      { slug: 'initial-consultation', name: 'Initial consultation', duration: 45, status: 'active' },
      { slug: 'follow-up', name: 'Follow-up appointment', duration: 30, status: 'active' },
    ],
    resources: [
      { name: 'Dr. Ada Martin', type: 'clinician', capacity: '-', status: 'active' },
      { name: 'Noah Bernard, PT', type: 'clinician', capacity: '-', status: 'active' },
      { name: 'Treatment room 1', type: 'room', capacity: 1, status: 'active' },
    ],
    bookings: [
      { id: 'bk_oak_clinic', customer: 'Demo Patient', service: 'Initial consultation', time: '09:00', status: 'checked_in' },
    ],
    customers: [
      { id: 'demo-patient', name: 'Demo Patient', email: 'patient@oakclinic.example', phone: '+33 1 23 45 67 89', updated: 'Today' },
      { id: 'follow-up-patient', name: 'Follow-up Patient', email: 'followup@oakclinic.example', phone: '+33 1 98 76 54 32', updated: 'Yesterday' },
    ],
    customFields: [
      { key: 'allergies', label: 'Allergies', type: 'Text', required: 'No' },
      { key: 'preferred_doctor', label: 'Preferred doctor', type: 'Select', required: 'No' },
    ],
  },
  'chef': {
    pages: [
      { id: 'home', title: 'Chef homepage', slug: 'home', status: 'published', seoTitle: 'Chef à domicile à Paris', seoDescription: 'Chef à domicile à Paris for private dinners and editorial presentation.' },
    ],
    services: [
      { slug: 'menu-degustation', name: 'Menu dégustation', duration: 120, status: 'active' },
      { slug: 'diner-prive', name: 'Dîner privé', duration: 150, status: 'active' },
      { slug: 'reception-privee', name: 'Réception privée', duration: 180, status: 'active' },
    ],
    resources: [
      { name: 'Chef Michel Hélène', type: 'chef', capacity: 2, status: 'active' },
    ],
    bookings: [
      { id: 'bk_chef', customer: 'Demo Guest', service: 'Menu dégustation', time: '19:30', status: 'confirmed' },
    ],
    customers: [],
    customFields: [],
  },
};

export function getTenantAdminDemoData(session: Pick<DevAdminSession, 'tenantSlug'>): TenantAdminDemoData {
  return TENANT_ADMIN_DEMO_DATA[session.tenantSlug];
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
  if (pathname === '/tenant/pages' || pathname.startsWith('/tenant/pages/') || pathname === '/admin/tenant/pages' || pathname.startsWith('/admin/tenant/pages/'))
    return 'frontpage';
  if (pathname === '/owner/bookings' || pathname.startsWith('/owner/bookings/') || pathname.startsWith('/tenant/booking/') || pathname.startsWith('/booking/')) return 'booking';
  if (pathname === '/owner/customers' || pathname.startsWith('/owner/customers/') || pathname.startsWith('/tenant/crm/') || pathname.startsWith('/crm/')) return 'crm';
  if (pathname === '/owner/quote-requests' || pathname.startsWith('/owner/quote-requests/') || pathname.startsWith('/tenant/quote-requests/')) return 'quote-request';
  return null;
}

export function surfaceForPath(pathname: string): AdminSurface | null {
  if (pathname === '/global-admin' || pathname.startsWith('/global-admin/')) return 'global-admin';
  if (pathname === '/tenant' || pathname.startsWith('/tenant/')) return 'tenant';
  if (pathname === '/owner' || pathname.startsWith('/owner/')) return 'owner';
  return null;
}

export function isSurfaceAllowed(surface: AdminSurface, session: Pick<DevAdminSession, 'roles'>): boolean {
  if (surface === 'global-admin') return can({ roles: session.roles }, 'platform.tenants.read');
  if (surface === 'tenant') return can({ roles: session.roles }, 'tenant.builder.read');
  return can({ roles: session.roles }, 'owner.dashboard.read');
}

export function isAdminRouteAllowed(pathname: string, session: Pick<DevAdminSession, 'enabledModules' | 'roles'>): boolean {
  const surface = surfaceForPath(pathname);
  if (surface && !isSurfaceAllowed(surface, session)) return false;
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
