export type TenantId = string;

export type TenantResolutionMethod = 'custom-domain' | 'subdomain' | 'development-prefix';

export interface TenantContext {
  tenantId: TenantId;
  slug: string;
  displayName?: string;
  enabledModules: string[];
  locale: string;
  timezone: string;
  themePresetId?: string;
  layoutConfig?: Record<string, unknown>;
  themeOverrides?: Record<string, unknown>;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  resolutionMethod?: TenantResolutionMethod;
}

export interface TenantLookupRecord {
  tenantId: TenantId;
  slug: string;
  displayName?: string;
  enabledModules: string[];
  locale: string;
  timezone: string;
  themePresetId?: string;
  layoutConfig?: Record<string, unknown>;
  themeOverrides?: Record<string, unknown>;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

export interface TenantResolverRepository {
  findByHostname(hostname: string): Promise<TenantLookupRecord | null>;
  findBySlug(slug: string): Promise<TenantLookupRecord | null>;
}

export interface TenantResolutionInput {
  hostname?: string | null;
  path?: string | null;
  baseDomains?: string[];
}

export const MARGO_PLATFORM_NAME = 'MARGO';

const PII_KEYS = new Set(['email', 'phone', 'firstName', 'lastName', 'displayName', 'name', 'address']);

export function redactPii<T>(value: T): T | '[redacted]' {
  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, PII_KEYS.has(key) ? '[redacted]' : redactPii(nested)]),
    ) as T;
  }
  return value;
}

export function createSafeLogEntry(input: { message: string; metadata?: Record<string, unknown> }) {
  return { message: input.message, metadata: redactPii(input.metadata ?? {}) };
}

export function assertCsrfOrNonCookieAuth(input: { method: string; headers: Record<string, string | undefined> }): void {
  const method = input.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;
  if (input.headers.authorization?.startsWith('Bearer ')) return;
  const csrfHeader = input.headers['x-margo-csrf-token'];
  const csrfCookie = input.headers['x-margo-csrf-cookie'];
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    throw new CsrfProtectionError();
  }
}

export class CsrfProtectionError extends Error {
  constructor() {
    super('Mutation requests must use bearer auth or a matching CSRF token.');
    this.name = 'CsrfProtectionError';
  }
}

const DEFAULT_LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function hasModule(context: Pick<TenantContext, 'enabledModules'>, moduleId: string): boolean {
  return context.enabledModules.includes(moduleId);
}

export async function resolveTenantContext(
  input: TenantResolutionInput,
  repository: TenantResolverRepository,
): Promise<TenantContext | null> {
  const hostname = normalizeHostname(input.hostname);
  const pathTenantSlug = extractDevelopmentTenantSlug(input.path);

  if (hostname && !isLocalHost(hostname)) {
    const byHostname = await repository.findByHostname(hostname);
    if (byHostname) {
      return toTenantContext(byHostname, 'custom-domain');
    }
  }

  const subdomainSlug = extractSubdomainSlug(hostname, input.baseDomains);
  if (subdomainSlug) {
    const bySubdomain = await repository.findBySlug(subdomainSlug);
    if (bySubdomain) {
      return toTenantContext(bySubdomain, 'subdomain');
    }
  }

  if (pathTenantSlug) {
    const byPath = await repository.findBySlug(pathTenantSlug);
    if (byPath) {
      return toTenantContext(byPath, 'development-prefix');
    }
  }

  return null;
}

export async function requireTenantContext(
  input: TenantResolutionInput,
  repository: TenantResolverRepository,
): Promise<TenantContext> {
  const context = await resolveTenantContext(input, repository);
  if (!context) {
    throw new TenantNotFoundError(input);
  }
  return context;
}

export function assertSameTenant(input: { expectedTenantId: TenantId; actualTenantId?: TenantId | null; operation?: string }): void {
  if (!input.actualTenantId || input.actualTenantId !== input.expectedTenantId) {
    throw new TenantAccessDeniedError(input.expectedTenantId, input.actualTenantId ?? 'unknown', input.operation);
  }
}

export class TenantNotFoundError extends Error {
  constructor(public readonly input: TenantResolutionInput) {
    super('Tenant could not be resolved for this request.');
    this.name = 'TenantNotFoundError';
  }
}

function toTenantContext(record: TenantLookupRecord, resolutionMethod: TenantResolutionMethod): TenantContext {
  return { ...record, resolutionMethod };
}

export function normalizeHostname(hostname?: string | null): string | null {
  if (!hostname) return null;
  const withoutProtocol = hostname.trim().toLowerCase().replace(/^https?:\/\//, '');
  const withoutPort = withoutProtocol.startsWith('[')
    ? withoutProtocol.replace(/^\[(.*)](?::\d+)?$/, '$1')
    : withoutProtocol.split(':')[0];
  return withoutPort && withoutPort.length > 0 ? withoutPort : null;
}

export function extractDevelopmentTenantSlug(path?: string | null): string | null {
  if (!path) return null;
  const match = path.match(/^\/t\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]).toLowerCase() : null;
}

export function extractSubdomainSlug(hostname?: string | null, baseDomains: string[] = []): string | null {
  const normalized = normalizeHostname(hostname);
  if (!normalized || isLocalHost(normalized)) return null;

  for (const baseDomain of baseDomains.map((domain) => normalizeHostname(domain)).filter(Boolean)) {
    if (normalized === baseDomain) return null;
    const suffix = `.${baseDomain}`;
    if (normalized.endsWith(suffix)) {
      const subdomain = normalized.slice(0, -suffix.length);
      return subdomain.includes('.') ? null : subdomain;
    }
  }

  if (normalized.endsWith('.localhost')) {
    return normalized.slice(0, -'.localhost'.length);
  }

  return null;
}

function isLocalHost(hostname: string): boolean {
  return DEFAULT_LOCAL_HOSTS.has(hostname);
}

export type Role =
  | 'global_admin'
  | 'tenant_admin'
  | 'tenant_owner'
  | 'tenant_staff'
  | 'provider'
  | 'marketing_editor'
  | 'analyst';

export type Permission =
  | 'platform.tenants.read'
  | 'platform.tenants.write'
  | 'platform.templates.manage'
  | 'platform.themes.manage'
  | 'tenant.builder.read'
  | 'tenant.builder.write'
  | 'owner.dashboard.read'
  | 'owner.calendar.write'
  | 'site.pages.read'
  | 'site.pages.write'
  | 'booking.read'
  | 'booking.write'
  | 'booking.cancel'
  | 'crm.customer.read'
  | 'crm.customer.write'
  | 'crm.note.write'
  | 'quote.request.read'
  | 'quote.request.write'
  | 'tenant.billing.manage'
  | 'tenant.modules.manage';

export const permissionRoles: Record<Permission, readonly Role[]> = {
  'platform.tenants.read': ['global_admin'],
  'platform.tenants.write': ['global_admin'],
  'platform.templates.manage': ['global_admin'],
  'platform.themes.manage': ['global_admin'],
  'tenant.builder.read': ['tenant_admin', 'marketing_editor'],
  'tenant.builder.write': ['tenant_admin'],
  'owner.dashboard.read': ['tenant_owner', 'tenant_staff', 'provider'],
  'owner.calendar.write': ['tenant_owner'],
  'site.pages.read': ['tenant_admin', 'marketing_editor'],
  'site.pages.write': ['tenant_admin', 'marketing_editor'],
  'booking.read': ['tenant_owner', 'tenant_staff', 'provider'],
  'booking.write': ['tenant_owner', 'tenant_staff'],
  'booking.cancel': ['tenant_owner', 'tenant_staff'],
  'crm.customer.read': ['tenant_owner', 'tenant_staff', 'provider'],
  'crm.customer.write': ['tenant_owner', 'tenant_staff'],
  'crm.note.write': ['tenant_owner', 'tenant_staff', 'provider'],
  'quote.request.read': ['tenant_owner', 'tenant_staff'],
  'quote.request.write': ['tenant_admin'],
  'tenant.billing.manage': ['tenant_owner'],
  'tenant.modules.manage': ['tenant_admin'],
};

export interface AdminPrincipal {
  userId: string;
  tenantId: TenantId;
  roles: Role[];
}

export function can(principal: Pick<AdminPrincipal, 'roles'>, permission: Permission): boolean {
  return principal.roles.some((role) => permissionRoles[permission].includes(role));
}

export interface AdminPermissionGuardInput {
  principal: AdminPrincipal | null | undefined;
  tenant: Pick<TenantContext, 'tenantId'>;
  permission: Permission;
}

export function requirePermission(principal: AdminPrincipal, permission: Permission): void {
  if (!can(principal, permission)) {
    throw new PermissionDeniedError(permission, principal.roles);
  }
}

export function guardAdminPermission(input: AdminPermissionGuardInput): AdminPrincipal {
  if (!input.principal) {
    throw new UnauthenticatedError();
  }
  if (input.principal.roles.includes('global_admin')) {
    return input.principal;
  }
  if (input.principal.tenantId !== input.tenant.tenantId) {
    throw new TenantAccessDeniedError(input.tenant.tenantId, input.principal.tenantId);
  }
  requirePermission(input.principal, input.permission);
  return input.principal;
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication is required for this admin API.');
    this.name = 'UnauthenticatedError';
  }
}

export class TenantAccessDeniedError extends Error {
  constructor(
    public readonly requestedTenantId: TenantId,
    public readonly principalTenantId: TenantId,
    public readonly operation?: string,
  ) {
    super(operation ? `Principal cannot access this tenant for ${operation}.` : 'Principal cannot access this tenant.');
    this.name = 'TenantAccessDeniedError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(
    public readonly permission: Permission,
    public readonly roles: readonly Role[],
  ) {
    super(`Missing required permission: ${permission}`);
    this.name = 'PermissionDeniedError';
  }
}

export interface BrandedErrorView {
  status: 403 | 404;
  title: string;
  message: string;
  tenant?: Pick<TenantContext, 'slug' | 'displayName' | 'themePresetId'>;
}

export function brandedNotFound(tenant?: TenantContext, message = 'The requested page was not found.'): BrandedErrorView {
  return {
    status: 404,
    title: tenant?.displayName ? `${tenant.displayName} — Not found` : 'Not found',
    message,
    tenant: tenant ? pickTenantBrand(tenant) : undefined,
  };
}

export function brandedForbidden(tenant?: TenantContext, message = 'You do not have access to this resource.'): BrandedErrorView {
  return {
    status: 403,
    title: tenant?.displayName ? `${tenant.displayName} — Access denied` : 'Access denied',
    message,
    tenant: tenant ? pickTenantBrand(tenant) : undefined,
  };
}

function pickTenantBrand(tenant: TenantContext): BrandedErrorView['tenant'] {
  return {
    slug: tenant.slug,
    displayName: tenant.displayName,
    themePresetId: tenant.themePresetId,
  };
}

export * from './carousel-presets';
export * from './page-block-registry';

export type DemoTenantSlug = 'bistro-frontpage' | 'table-and-co' | 'maison-noire' | 'oak-clinic' | 'chef';

export interface DemoTenantCatalogEntry {
  slug: DemoTenantSlug;
  tenantName: string;
  enabledModules: string[];
  booking?: {
    title: string;
    serviceId: string;
    resourceId: string;
    resourceLabel: string;
    duration: number;
    opensAt: string;
    closesAt: string;
    partySize?: number;
  };
}

export interface TenantWebappExportPackage {
  kind: 'margo.tenant-webapp-export';
  exportVersion: string;
  sourceAppVersion: string;
  createdAt: string;
  tenant: { slug: string; displayName: string; locale?: string; timezone?: string };
  enabledModules: string[];
  theme: { presetId: string; tokens?: Record<string, unknown> };
  branding: Record<string, unknown>;
  pages: Array<Record<string, unknown>>;
  modules: Record<string, { version: string; config: Record<string, unknown>; data?: unknown }>;
  assets: Array<{ key: string; url?: string; checksum?: string }>;
  migrations: string[];
  unknown?: Record<string, unknown>;
}

export interface TenantTemplatePackage {
  kind: 'margo.tenant-template';
  id: string;
  name: string;
  templateVersion: string;
  sourceExportVersion: string;
  enabledModules: string[];
  themePresetId: string;
  defaults: Record<string, unknown>;
}

export interface TenantImportReport {
  canImport: boolean;
  fromVersion: string;
  toVersion: string;
  migrationsApplied: string[];
  warnings: string[];
}

export const CURRENT_TENANT_EXPORT_VERSION = '1.0.0';

export function createTenantWebappExport(input: Omit<TenantWebappExportPackage, 'kind' | 'exportVersion' | 'createdAt' | 'migrations'> & { createdAt?: string; exportVersion?: string; migrations?: string[] }): TenantWebappExportPackage {
  return {
    kind: 'margo.tenant-webapp-export',
    exportVersion: input.exportVersion ?? CURRENT_TENANT_EXPORT_VERSION,
    sourceAppVersion: input.sourceAppVersion,
    createdAt: input.createdAt ?? new Date().toISOString(),
    tenant: input.tenant,
    enabledModules: input.enabledModules,
    theme: input.theme,
    branding: input.branding,
    pages: input.pages,
    modules: input.modules,
    assets: input.assets,
    migrations: input.migrations ?? [],
    unknown: input.unknown,
  };
}

export function validateTenantWebappImportPackage(value: unknown): TenantImportReport {
  const warnings: string[] = [];
  if (!value || typeof value !== 'object') {
    return { canImport: false, fromVersion: 'unknown', toVersion: CURRENT_TENANT_EXPORT_VERSION, migrationsApplied: [], warnings: ['Export package must be an object.'] };
  }
  const pkg = value as Partial<TenantWebappExportPackage> & Record<string, unknown>;
  if (pkg.kind !== 'margo.tenant-webapp-export') warnings.push('Unknown package kind.');
  const fromVersion = typeof pkg.exportVersion === 'string' ? pkg.exportVersion : '0.0.0';
  if (!pkg.tenant || typeof pkg.tenant !== 'object') warnings.push('Missing tenant metadata; safe defaults will be required.');
  if (!Array.isArray(pkg.enabledModules)) warnings.push('Missing enabled module list; importing as frontpage-only.');
  if (!pkg.modules || typeof pkg.modules !== 'object') warnings.push('Missing module payloads; module defaults will be used.');
  const migrationsApplied = fromVersion === CURRENT_TENANT_EXPORT_VERSION ? [] : [`tenant-export:${fromVersion}->${CURRENT_TENANT_EXPORT_VERSION}`];
  return { canImport: pkg.kind === 'margo.tenant-webapp-export', fromVersion, toVersion: CURRENT_TENANT_EXPORT_VERSION, migrationsApplied, warnings };
}

export function materializeTemplateFromExport(input: { templateId: string; name: string; exportPackage: TenantWebappExportPackage }): TenantTemplatePackage {
  return {
    kind: 'margo.tenant-template',
    id: input.templateId,
    name: input.name,
    templateVersion: '1.0.0',
    sourceExportVersion: input.exportPackage.exportVersion,
    enabledModules: input.exportPackage.enabledModules,
    themePresetId: input.exportPackage.theme.presetId,
    defaults: {
      branding: input.exportPackage.branding,
      pages: input.exportPackage.pages,
      modules: input.exportPackage.modules,
      assets: input.exportPackage.assets,
    },
  };
}

export function listBuiltinTemplateSummaries(): Array<Pick<TenantTemplatePackage, 'id' | 'name' | 'templateVersion' | 'enabledModules' | 'themePresetId'>> {
  return Object.values(DEMO_TENANTS).map((tenant) => ({
    id: `demo-${tenant.slug}`,
    name: `${tenant.tenantName} starter`,
    templateVersion: '1.0.0',
    enabledModules: tenant.enabledModules,
    themePresetId: tenant.slug === 'oak-clinic' ? 'clinical-calm' : tenant.slug === 'maison-noire' ? 'luxury-dark-dining' : tenant.slug === 'chef' ? 'chef' : 'editorial-bistro',
  }));
}

export const DEMO_TENANTS: Record<DemoTenantSlug, DemoTenantCatalogEntry> = {
  'bistro-frontpage': {
    slug: 'bistro-frontpage',
    tenantName: 'Bistro Lumiere',
    enabledModules: ['frontpage'],
  },
  'table-and-co': {
    slug: 'table-and-co',
    tenantName: 'Table & Co',
    enabledModules: ['frontpage', 'notifications', 'booking'],
    booking: {
      title: 'Reserve a table',
      serviceId: 'dinner-reservation',
      resourceId: 'table-2',
      resourceLabel: 'Table 2',
      duration: 90,
      opensAt: '18:00',
      closesAt: '21:00',
      partySize: 2,
    },
  },
  'maison-noire': {
    slug: 'maison-noire',
    tenantName: 'Maison Noire',
    enabledModules: ['frontpage', 'booking', 'notifications', 'quote-request'],
    booking: {
      title: 'Reserve your table',
      serviceId: 'tasting-menu',
      resourceId: 'salon-a',
      resourceLabel: 'Salon A',
      duration: 120,
      opensAt: '19:00',
      closesAt: '22:30',
      partySize: 2,
    },
  },
  'oak-clinic': {
    slug: 'oak-clinic',
    tenantName: 'Oak Clinic',
    enabledModules: ['frontpage', 'notifications', 'booking', 'crm'],
    booking: {
      title: 'Book an appointment',
      serviceId: 'initial-consultation',
      resourceId: 'clinician-1',
      resourceLabel: 'Dr. Ada Martin',
      duration: 45,
      opensAt: '09:00',
      closesAt: '12:00',
    },
  },
  'chef': {
    slug: 'chef',
    tenantName: 'Chef Michel Hélène',
    enabledModules: ['frontpage', 'booking', 'notifications', 'quote-request'],
    booking: {
      title: 'Réservation',
      serviceId: 'menu-degustation',
      resourceId: 'chef-michel-helene',
      resourceLabel: 'Chef Michel Hélène',
      duration: 120,
      opensAt: '19:00',
      closesAt: '22:00',
      partySize: 2,
    },
  },
};
