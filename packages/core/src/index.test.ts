import { describe, expect, it } from 'vitest';
import {
  brandedForbidden,
  brandedNotFound,
  can,
  extractDevelopmentTenantSlug,
  extractSubdomainSlug,
  hasModule,
  guardAdminPermission,
  PermissionDeniedError,
  requirePermission,
  TenantAccessDeniedError,
  UnauthenticatedError,
  resolveTenantContext,
  type TenantLookupRecord,
  type TenantResolverRepository,
} from './index';

const tenants: Record<string, TenantLookupRecord> = {
  bistro: {
    tenantId: 'tenant-bistro',
    slug: 'bistro',
    displayName: 'Bistro Demo',
    enabledModules: ['frontpage'],
    locale: 'en',
    timezone: 'Europe/Paris',
    themePresetId: 'editorial-bistro',
  },
  clinic: {
    tenantId: 'tenant-clinic',
    slug: 'clinic',
    displayName: 'Clinic Demo',
    enabledModules: ['frontpage', 'booking', 'crm'],
    locale: 'en',
    timezone: 'Europe/Paris',
    themePresetId: 'clinical-calm',
  },
};

const repository: TenantResolverRepository = {
  async findByHostname(hostname) {
    return hostname === 'custom.example.com' ? tenants.clinic! : null;
  },
  async findBySlug(slug) {
    return tenants[slug] ?? null;
  },
};

describe('tenant resolution', () => {
  it('keeps the original module helper behavior', () => {
    expect(hasModule({ enabledModules: ['frontpage'] }, 'frontpage')).toBe(true);
    expect(hasModule({ enabledModules: ['frontpage'] }, 'booking')).toBe(false);
  });

  it('extracts development tenant prefixes', () => {
    expect(extractDevelopmentTenantSlug('/t/bistro/book')).toBe('bistro');
    expect(extractDevelopmentTenantSlug('/book')).toBeNull();
  });

  it('extracts single-level subdomains for configured base domains', () => {
    expect(extractSubdomainSlug('bistro.margo.test', ['margo.test'])).toBe('bistro');
    expect(extractSubdomainSlug('deep.bistro.margo.test', ['margo.test'])).toBeNull();
  });

  it('resolves custom hostname before path tenant prefix', async () => {
    const context = await resolveTenantContext(
      { hostname: 'custom.example.com', path: '/t/bistro', baseDomains: ['example.com'] },
      repository,
    );

    expect(context?.slug).toBe('clinic');
    expect(context?.resolutionMethod).toBe('custom-domain');
  });

  it('resolves subdomain before path tenant prefix when hostname is not custom domain', async () => {
    const context = await resolveTenantContext(
      { hostname: 'clinic.margo.test', path: '/t/bistro', baseDomains: ['margo.test'] },
      repository,
    );

    expect(context?.slug).toBe('clinic');
    expect(context?.resolutionMethod).toBe('subdomain');
  });

  it('uses /t/:tenantSlug as local development fallback', async () => {
    const context = await resolveTenantContext({ hostname: 'localhost:3000', path: '/t/bistro' }, repository);

    expect(context?.slug).toBe('bistro');
    expect(context?.resolutionMethod).toBe('development-prefix');
  });
});

describe('RBAC', () => {
  it('allows roles listed for a permission', () => {
    expect(can({ roles: ['front_desk'] }, 'booking.write')).toBe(true);
    expect(can({ roles: ['marketing_editor'] }, 'booking.write')).toBe(false);
  });

  it('always allows platform super admins', () => {
    expect(can({ roles: ['platform_super_admin'] }, 'tenant.modules.manage')).toBe(true);
  });

  it('throws for denied admin permissions', () => {
    expect(() =>
      requirePermission({ userId: 'user-1', tenantId: 'tenant-1', roles: ['provider'] }, 'tenant.modules.manage'),
    ).toThrow(PermissionDeniedError);
  });

  it('guards admin APIs with authentication, tenant isolation, and permission checks', () => {
    const tenant = { tenantId: 'tenant-1' };

    expect(() => guardAdminPermission({ principal: null, tenant, permission: 'booking.read' })).toThrow(UnauthenticatedError);
    expect(() =>
      guardAdminPermission({
        principal: { userId: 'user-1', tenantId: 'tenant-2', roles: ['tenant_owner'] },
        tenant,
        permission: 'booking.read',
      }),
    ).toThrow(TenantAccessDeniedError);
    expect(
      guardAdminPermission({
        principal: { userId: 'user-1', tenantId: 'tenant-1', roles: ['front_desk'] },
        tenant,
        permission: 'booking.read',
      }).userId,
    ).toBe('user-1');
  });
});

describe('branded errors', () => {
  it('keeps tenant branding in 404/403 view models', () => {
    expect(brandedNotFound({ ...tenants.bistro!, resolutionMethod: 'development-prefix' }).tenant?.themePresetId).toBe(
      'editorial-bistro',
    );
    expect(brandedForbidden({ ...tenants.clinic!, resolutionMethod: 'custom-domain' }).status).toBe(403);
  });
});
