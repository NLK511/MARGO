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
  assertCsrfOrNonCookieAuth,
  assertSameTenant,
  CsrfProtectionError,
  createSafeLogEntry,
  createCarouselPresetProps,
  createTenantWebappExport,
  getCarouselPresetDefaults,
  getCarouselPresetSlides,
  getPageBlockOptions,
  listBuiltinTemplateSummaries,
  materializeTemplateFromExport,
  TenantAccessDeniedError,
  UnauthenticatedError,
  resolveTenantContext,
  validateTenantWebappImportPackage,
  type TenantLookupRecord,
  type TenantResolverRepository,
} from './index';
import { createDefaultPageBlockProps } from './page-block-registry';

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
    expect(can({ roles: ['tenant_staff'] }, 'booking.write')).toBe(true);
    expect(can({ roles: ['marketing_editor'] }, 'booking.write')).toBe(false);
  });

  it('keeps global admin, tenant admin, and owner permissions separate', () => {
    expect(can({ roles: ['global_admin'] }, 'platform.tenants.write')).toBe(true);
    expect(can({ roles: ['global_admin'] }, 'tenant.modules.manage')).toBe(false);
    expect(can({ roles: ['tenant_admin'] }, 'tenant.modules.manage')).toBe(true);
    expect(can({ roles: ['tenant_owner'] }, 'tenant.modules.manage')).toBe(false);
    expect(can({ roles: ['tenant_owner'] }, 'booking.read')).toBe(true);
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
        principal: { userId: 'user-1', tenantId: 'tenant-1', roles: ['tenant_staff'] },
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

describe('block registry', () => {
  it('keeps the core block registry intentionally small', () => {
    expect(getPageBlockOptions().map((option) => option.value)).toEqual([
      'hero',
      'service-list',
      'image',
      'carousel',
      'split-media',
      'rich-text',
      'location',
      'contact-form',
      'cta',
    ]);
  });

  it('provides image block defaults with an optional button model', () => {
    expect(createDefaultPageBlockProps('image', 'Hero image')).toMatchObject({
      caption: 'A seasonal visual block.',
      imageUrl: '',
      buttonEnabled: false,
      buttonLabel: 'View gallery',
      buttonHref: '#gallery',
      buttonPosition: 'bottom-right',
      buttonStyle: 'primary',
      buttonTextStyle: { fontFamily: '', color: '', fontSize: '', lineHeight: '', textAlign: '' },
      buttonSpacing: { margin: '', padding: '' },
    });
  });
});

describe('carousel presets', () => {
  it('shares preset defaults and fallback slides', () => {
    expect(getCarouselPresetDefaults('testimonials')).toMatchObject({ visibleCount: 1, scrollMode: 'auto' });
    expect(getCarouselPresetSlides('offers')).toHaveLength(2);
    expect(getCarouselPresetSlides('cards')[0]?.eyebrow).toBeUndefined();
    expect(createCarouselPresetProps('gallery', { title: 'Gallery' })).toMatchObject({ title: 'Gallery', slides: expect.any(Array) });
  });
});

describe('tenant export/import and templates', () => {
  it('creates versioned export packages and validates current imports', () => {
    const pkg = createTenantWebappExport({
      sourceAppVersion: 'test',
      tenant: { slug: 'demo', displayName: 'Demo' },
      enabledModules: ['frontpage'],
      theme: { presetId: 'editorial-bistro' },
      branding: {},
      pages: [{ slug: 'home' }],
      modules: { frontpage: { version: '1.0.0', config: {} } },
      assets: [],
    });

    expect(pkg.kind).toBe('margo.tenant-webapp-export');
    expect(validateTenantWebappImportPackage(pkg)).toMatchObject({ canImport: true, migrationsApplied: [] });
  });

  it('reports old export migrations and can materialize file-based templates', () => {
    const oldPkg = createTenantWebappExport({
      exportVersion: '0.1.0',
      sourceAppVersion: 'old',
      tenant: { slug: 'old-demo', displayName: 'Old Demo' },
      enabledModules: ['frontpage', 'booking'],
      theme: { presetId: 'clinical-calm' },
      branding: { logoUrl: '/logo.svg' },
      pages: [],
      modules: {},
      assets: [],
    });

    expect(validateTenantWebappImportPackage(oldPkg).migrationsApplied).toEqual(['tenant-export:0.1.0->1.0.0']);
    expect(materializeTemplateFromExport({ templateId: 'starter', name: 'Starter', exportPackage: oldPkg })).toMatchObject({
      kind: 'margo.tenant-template',
      enabledModules: ['frontpage', 'booking'],
    });
    expect(listBuiltinTemplateSummaries().length).toBeGreaterThanOrEqual(4);
  });
});

describe('tenant isolation helpers', () => {
  it('rejects cross-tenant record access with operation context', () => {
    expect(() => assertSameTenant({ expectedTenantId: 'tenant-a', actualTenantId: 'tenant-b', operation: 'booking.read' })).toThrow(TenantAccessDeniedError);
    expect(() => assertSameTenant({ expectedTenantId: 'tenant-a', actualTenantId: 'tenant-a', operation: 'booking.read' })).not.toThrow();
  });
});

describe('hardening helpers', () => {
  it('redacts PII from safe log entries recursively', () => {
    const entry = createSafeLogEntry({
      message: 'booking.created',
      metadata: { customer: { email: 'guest@example.com', phone: '+331', id: 'cus_1' }, status: 'confirmed' },
    });

    expect(entry.metadata).toEqual({ customer: { email: '[redacted]', phone: '[redacted]', id: 'cus_1' }, status: 'confirmed' });
  });

  it('allows bearer-auth mutations and rejects cookie mutations without CSRF', () => {
    expect(() => assertCsrfOrNonCookieAuth({ method: 'POST', headers: { authorization: 'Bearer dev' } })).not.toThrow();
    expect(() =>
      assertCsrfOrNonCookieAuth({ method: 'PATCH', headers: { 'x-margo-csrf-token': 'a', 'x-margo-csrf-cookie': 'a' } }),
    ).not.toThrow();
    expect(() => assertCsrfOrNonCookieAuth({ method: 'DELETE', headers: {} })).toThrow(CsrfProtectionError);
  });
});
