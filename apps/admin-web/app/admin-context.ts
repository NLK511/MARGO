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
