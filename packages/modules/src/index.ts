export type ModuleId = 'frontpage' | 'booking' | 'crm' | 'payments' | 'notifications' | 'analytics' | string;

export interface PermissionDefinition {
  permission: string;
  description: string;
}

export interface RouteDefinition {
  path: string;
  permission?: string;
}

export interface ApiRouteDefinition extends RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface EventSubscription {
  eventType: string;
  handler: string;
}

export interface MenuItemDefinition {
  label: string;
  path: string;
  permission?: string;
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  permission?: string;
}

export interface ModuleExportAdapterDefinition {
  currentVersion: string;
  exportKey: string;
  migrators: string[];
}

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  version: string;
  description: string;
  dependencies: ModuleId[];
  optionalDependencies?: ModuleId[];
  tenantConfigSchema?: unknown;
  permissions: PermissionDefinition[];
  publicRoutes: RouteDefinition[];
  adminRoutes: RouteDefinition[];
  ownerRoutes?: RouteDefinition[];
  apiRoutes: ApiRouteDefinition[];
  eventSubscriptions: EventSubscription[];
  menuItems: MenuItemDefinition[];
  widgets?: DashboardWidgetDefinition[];
  exportAdapter?: ModuleExportAdapterDefinition;
}

export interface ModuleDependencyIssue {
  moduleId: ModuleId;
  missingDependency: ModuleId;
}

export interface ModuleRegistry {
  manifests: readonly ModuleManifest[];
  get(moduleId: ModuleId): ModuleManifest | undefined;
  isInstalled(moduleId: ModuleId): boolean;
  validateEnabledModules(enabledModuleIds: readonly ModuleId[]): ModuleDependencyIssue[];
  enabledManifests(enabledModuleIds: readonly ModuleId[]): ModuleManifest[];
}

export const coreModuleManifests: ModuleManifest[] = [
  {
    id: 'frontpage',
    name: 'Frontpage',
    version: '0.0.0',
    description: 'Tenant public website pages and blocks.',
    dependencies: [],
    permissions: [
      { permission: 'site.pages.read', description: 'Read public pages.' },
      { permission: 'site.pages.write', description: 'Create and publish public pages.' },
    ],
    publicRoutes: [{ path: '/' }, { path: '/t/:tenantSlug' }, { path: '/:slug' }],
    adminRoutes: [
      { path: '/tenant/pages', permission: 'site.pages.read' },
      { path: '/tenant/pages/new', permission: 'site.pages.write' },
      { path: '/tenant/pages/:pageId', permission: 'site.pages.write' },
      { path: '/tenant/pages/:pageId/preview', permission: 'site.pages.read' },
    ],
    apiRoutes: [
      { method: 'GET', path: '/api/v1/public/pages/:slug' },
      { method: 'POST', path: '/api/v1/public/contact' },
      { method: 'GET', path: '/api/v1/admin/tenant/pages', permission: 'site.pages.read' },
      { method: 'POST', path: '/api/v1/admin/tenant/pages', permission: 'site.pages.write' },
      { method: 'PATCH', path: '/api/v1/admin/tenant/pages/:pageId', permission: 'site.pages.write' },
      { method: 'PATCH', path: '/api/v1/admin/tenant/pages/:pageId/publish', permission: 'site.pages.write' },
    ],
    eventSubscriptions: [],
    menuItems: [{ label: 'Pages', path: '/tenant/pages', permission: 'site.pages.read' }],
    exportAdapter: { currentVersion: '1.0.0', exportKey: 'frontpage', migrators: [] },
  },
  {
    id: 'notifications',
    name: 'Notifications',
    version: '0.0.0',
    description: 'Outbox-backed notification requests.',
    dependencies: [],
    permissions: [],
    publicRoutes: [],
    adminRoutes: [],
    apiRoutes: [],
    eventSubscriptions: [
      { eventType: 'booking.created', handler: 'queueBookingConfirmation' },
      { eventType: 'booking.cancelled', handler: 'queueBookingCancellation' },
    ],
    menuItems: [],
  },
  {
    id: 'booking',
    name: 'Booking',
    version: '0.0.0',
    description: 'Public and staff booking workflows.',
    dependencies: ['notifications'],
    optionalDependencies: ['payments'],
    permissions: [
      { permission: 'booking.read', description: 'Read bookings and schedules.' },
      { permission: 'booking.write', description: 'Create and update bookings.' },
      { permission: 'booking.cancel', description: 'Cancel bookings.' },
    ],
    publicRoutes: [{ path: '/booking' }, { path: '/booking/confirmation/:token' }, { path: '/booking/manage/:token' }],
    adminRoutes: [
      { path: '/tenant/booking/services', permission: 'booking.write' },
      { path: '/tenant/booking/resources', permission: 'booking.write' },
    ],
    ownerRoutes: [
      { path: '/owner/bookings', permission: 'booking.read' },
      { path: '/owner/bookings/new', permission: 'booking.write' },
    ],
    apiRoutes: [
      { method: 'GET', path: '/api/v1/public/availability' },
      { method: 'POST', path: '/api/v1/public/bookings' },
      { method: 'PATCH', path: '/api/v1/public/bookings/:publicToken/cancel' },
      { method: 'GET', path: '/api/v1/admin/bookings', permission: 'booking.read' },
      { method: 'POST', path: '/api/v1/admin/services', permission: 'booking.write' },
      { method: 'PATCH', path: '/api/v1/admin/services/:serviceId', permission: 'booking.write' },
      { method: 'POST', path: '/api/v1/admin/resources', permission: 'booking.write' },
      { method: 'PATCH', path: '/api/v1/admin/resources/:resourceId', permission: 'booking.write' },
      { method: 'PATCH', path: '/api/v1/admin/bookings/:bookingId/cancel', permission: 'booking.cancel' },
      { method: 'PATCH', path: '/api/v1/admin/bookings/:bookingId/check-in', permission: 'booking.write' },
      { method: 'PATCH', path: '/api/v1/admin/bookings/:bookingId/no-show', permission: 'booking.write' },
    ],
    eventSubscriptions: [],
    menuItems: [{ label: 'Bookings', path: '/owner/bookings', permission: 'booking.read' }],
    exportAdapter: { currentVersion: '1.0.0', exportKey: 'booking', migrators: [] },
  },
  {
    id: 'crm',
    name: 'CRM',
    version: '0.0.0',
    description: 'Customer profiles, notes, and timeline.',
    dependencies: [],
    optionalDependencies: ['booking'],
    permissions: [
      { permission: 'crm.customer.read', description: 'Read customer profiles.' },
      { permission: 'crm.customer.write', description: 'Create and update customers.' },
      { permission: 'crm.note.write', description: 'Create customer notes.' },
    ],
    publicRoutes: [],
    adminRoutes: [
      { path: '/tenant/crm/custom-fields', permission: 'crm.customer.write' },
    ],
    ownerRoutes: [
      { path: '/owner/customers', permission: 'crm.customer.read' },
      { path: '/owner/customers/:customerId', permission: 'crm.customer.read' },
      { path: '/owner/customers/:customerId/notes', permission: 'crm.note.write' },
    ],
    apiRoutes: [
      { method: 'GET', path: '/api/v1/admin/customers', permission: 'crm.customer.read' },
      { method: 'GET', path: '/api/v1/admin/customers/:customerId', permission: 'crm.customer.read' },
      { method: 'POST', path: '/api/v1/admin/customers', permission: 'crm.customer.write' },
      { method: 'GET', path: '/api/v1/admin/customers/:customerId/timeline', permission: 'crm.customer.read' },
      { method: 'GET', path: '/api/v1/admin/customers/:customerId/notes', permission: 'crm.customer.read' },
      { method: 'POST', path: '/api/v1/admin/customers/:customerId/notes', permission: 'crm.note.write' },
      { method: 'GET', path: '/api/v1/admin/crm/custom-fields', permission: 'crm.customer.read' },
      { method: 'POST', path: '/api/v1/admin/crm/custom-fields', permission: 'crm.customer.write' },
    ],
    eventSubscriptions: [{ eventType: 'booking.created', handler: 'appendBookingTimelineEvent' }],
    menuItems: [{ label: 'Customers', path: '/owner/customers', permission: 'crm.customer.read' }],
    exportAdapter: { currentVersion: '1.0.0', exportKey: 'crm', migrators: [] },
  },
  {
    id: 'quote-request',
    name: 'Quote Request',
    version: '0.0.0',
    description: 'Configurable quote wizard and lead capture.',
    dependencies: ['notifications'],
    optionalDependencies: ['crm'],
    permissions: [
      { permission: 'quote.request.read', description: 'Read quote requests and leads.' },
      { permission: 'quote.request.write', description: 'Edit quote wizard settings.' },
    ],
    publicRoutes: [
      { path: '/quote-request' },
      { path: '/quote-request/confirmation/:token' },
      { path: '/t/:tenantSlug/quote-request' },
      { path: '/t/:tenantSlug/quote-request/confirmation/:token' },
    ],
    adminRoutes: [
      { path: '/tenant/quote-requests/settings', permission: 'quote.request.write' },
    ],
    ownerRoutes: [
      { path: '/owner/quote-requests', permission: 'quote.request.read' },
      { path: '/owner/quote-requests/:quoteRequestId', permission: 'quote.request.read' },
    ],
    apiRoutes: [
      { method: 'POST', path: '/api/v1/public/quote-requests' },
      { method: 'GET', path: '/api/v1/admin/quote-requests', permission: 'quote.request.read' },
      { method: 'GET', path: '/api/v1/admin/quote-requests/:quoteRequestId', permission: 'quote.request.read' },
      { method: 'GET', path: '/api/v1/admin/quote-request-config', permission: 'quote.request.write' },
      { method: 'PATCH', path: '/api/v1/admin/quote-request-config', permission: 'quote.request.write' },
    ],
    eventSubscriptions: [],
    menuItems: [{ label: 'Quote requests', path: '/owner/quote-requests', permission: 'quote.request.read' }],
    exportAdapter: { currentVersion: '1.0.0', exportKey: 'quote-request', migrators: [] },
  },
];

export const moduleRegistry = createModuleRegistry(coreModuleManifests);

export function createModuleRegistry(manifests: readonly ModuleManifest[]): ModuleRegistry {
  const byId = new Map<ModuleId, ModuleManifest>();
  for (const manifest of manifests) {
    if (byId.has(manifest.id)) {
      throw new Error(`Duplicate module manifest id: ${manifest.id}`);
    }
    byId.set(manifest.id, manifest);
  }

  return {
    manifests,
    get: (moduleId) => byId.get(moduleId),
    isInstalled: (moduleId) => byId.has(moduleId),
    validateEnabledModules: (enabledModuleIds) => validateModuleDependencies(enabledModuleIds, manifests),
    enabledManifests: (enabledModuleIds) => enabledModuleIds.map((id) => byId.get(id)).filter(isManifest),
  };
}

export function validateModuleDependencies(
  enabledModuleIds: readonly ModuleId[],
  manifests: readonly ModuleManifest[] = coreModuleManifests,
): ModuleDependencyIssue[] {
  const enabled = new Set(enabledModuleIds);
  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  const issues: ModuleDependencyIssue[] = [];

  for (const moduleId of enabled) {
    const manifest = byId.get(moduleId);
    if (!manifest) {
      issues.push({ moduleId, missingDependency: moduleId });
      continue;
    }

    for (const dependency of manifest.dependencies) {
      if (!enabled.has(dependency)) {
        issues.push({ moduleId, missingDependency: dependency });
      }
    }
  }

  return issues;
}

export function isTenantModuleEnabled(enabledModuleIds: readonly ModuleId[], moduleId: ModuleId): boolean {
  return enabledModuleIds.includes(moduleId);
}

export type ModuleRouteAccess =
  | { allowed: true; manifest: ModuleManifest }
  | { allowed: false; status: 404; reason: 'module_not_installed' | 'module_disabled' }
  | { allowed: false; status: 403; reason: 'missing_dependency'; missingDependencies: ModuleId[] };

export function evaluateModuleRouteAccess(
  moduleId: ModuleId,
  enabledModuleIds: readonly ModuleId[],
  registry: ModuleRegistry = moduleRegistry,
): ModuleRouteAccess {
  const manifest = registry.get(moduleId);
  if (!manifest) {
    return { allowed: false, status: 404, reason: 'module_not_installed' };
  }

  if (!isTenantModuleEnabled(enabledModuleIds, moduleId)) {
    return { allowed: false, status: 404, reason: 'module_disabled' };
  }

  const missingDependencies = validateModuleDependencies(enabledModuleIds, registry.manifests)
    .filter((issue) => issue.moduleId === moduleId)
    .map((issue) => issue.missingDependency);

  if (missingDependencies.length > 0) {
    return { allowed: false, status: 403, reason: 'missing_dependency', missingDependencies };
  }

  return { allowed: true, manifest };
}

function isManifest(manifest: ModuleManifest | undefined): manifest is ModuleManifest {
  return Boolean(manifest);
}
