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
  | 'platform_super_admin'
  | 'tenant_owner'
  | 'location_manager'
  | 'front_desk'
  | 'provider'
  | 'marketing_editor'
  | 'analyst';

export type Permission =
  | 'site.pages.read'
  | 'site.pages.write'
  | 'booking.read'
  | 'booking.write'
  | 'booking.cancel'
  | 'crm.customer.read'
  | 'crm.customer.write'
  | 'crm.note.write'
  | 'tenant.billing.manage'
  | 'tenant.modules.manage';

export const permissionRoles: Record<Permission, readonly Role[]> = {
  'site.pages.read': ['tenant_owner', 'marketing_editor'],
  'site.pages.write': ['tenant_owner', 'marketing_editor'],
  'booking.read': ['tenant_owner', 'location_manager', 'front_desk', 'provider'],
  'booking.write': ['tenant_owner', 'location_manager', 'front_desk'],
  'booking.cancel': ['tenant_owner', 'location_manager', 'front_desk'],
  'crm.customer.read': ['tenant_owner', 'location_manager', 'front_desk', 'provider'],
  'crm.customer.write': ['tenant_owner', 'location_manager', 'front_desk'],
  'crm.note.write': ['tenant_owner', 'location_manager', 'front_desk', 'provider'],
  'tenant.billing.manage': ['tenant_owner'],
  'tenant.modules.manage': ['tenant_owner'],
};

export interface AdminPrincipal {
  userId: string;
  tenantId: TenantId;
  roles: Role[];
}

export function can(principal: Pick<AdminPrincipal, 'roles'>, permission: Permission): boolean {
  if (principal.roles.includes('platform_super_admin')) return true;
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
  if (input.principal.roles.includes('platform_super_admin')) {
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
  ) {
    super('Principal cannot access this tenant.');
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
