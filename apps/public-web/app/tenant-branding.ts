import { headers } from 'next/headers';
import { DEMO_TENANTS, type DemoTenantSlug, resolveTenantContext } from '@margo/core';
import { createPrismaTenantResolverRepository } from '@margo/db';
import { createThemeRuntimeSurface, getThemePreset, mergeTheme, type ThemeOverrides, type ThemePreset } from '@margo/themes';

export interface TenantBrandingSnapshot {
  slug: string;
  displayName: string;
  themePresetId: string;
  layoutConfig?: Record<string, unknown>;
  themeOverrides?: Record<string, unknown>;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

const DEMO_BRANDING: Record<DemoTenantSlug, Partial<TenantBrandingSnapshot>> = {
  'bistro-frontpage': { themePresetId: 'editorial-bistro' },
  'table-and-co': { themePresetId: 'editorial-bistro' },
  'maison-noire': {
    themePresetId: 'luxury-dark-dining',
    layoutConfig: { nav: 'overlay', hero: 'full-bleed' },
    logoUrl: '/demo-assets/luxury/logo.svg',
    faviconUrl: '/demo-assets/luxury/favicon.svg',
    themeOverrides: {
      assets: {
        backgroundImageUrl: '/demo-assets/luxury/page-bg.svg',
        cardBackgroundImageUrl: '/demo-assets/luxury/card-bg.svg',
        heroBackgroundImageUrl: '/demo-assets/luxury/hero-bg.svg',
      },
    },
  },
  'oak-clinic': { themePresetId: 'clinical-calm' },
};

export async function resolvePublicTenantBranding(tenantSlug: string): Promise<TenantBrandingSnapshot> {
  const requestHeaders = await headers();
  const tenant = await resolveTenantContext(
    {
      hostname: requestHeaders.get('host'),
      path: `/t/${tenantSlug}`,
      baseDomains: (process.env.MARGO_BASE_DOMAINS ?? '').split(',').filter(Boolean),
    },
    createPrismaTenantResolverRepository(),
  );

  if (tenant) {
    return {
      slug: tenant.slug,
      displayName: tenant.displayName ?? tenant.slug,
      themePresetId: tenant.themePresetId ?? 'clinical-calm',
      layoutConfig: tenant.layoutConfig,
      themeOverrides: tenant.themeOverrides,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
    };
  }

  const demoTenant = DEMO_TENANTS[tenantSlug as DemoTenantSlug];
  const demoBranding = DEMO_BRANDING[tenantSlug as DemoTenantSlug];
  return {
    slug: tenantSlug,
    displayName: demoTenant?.tenantName ?? tenantSlug,
    themePresetId: demoBranding?.themePresetId ?? 'clinical-calm',
    layoutConfig: demoBranding?.layoutConfig,
    themeOverrides: demoBranding?.themeOverrides,
    logoUrl: demoBranding?.logoUrl ?? null,
    faviconUrl: demoBranding?.faviconUrl ?? null,
  };
}

export function getDemoTenantBranding(tenantSlug: DemoTenantSlug): TenantBrandingSnapshot {
  const demoTenant = DEMO_TENANTS[tenantSlug];
  const demoBranding = DEMO_BRANDING[tenantSlug];
  return {
    slug: tenantSlug,
    displayName: demoTenant.tenantName,
    themePresetId: demoBranding?.themePresetId ?? 'clinical-calm',
    layoutConfig: demoBranding?.layoutConfig,
    themeOverrides: demoBranding?.themeOverrides,
    logoUrl: demoBranding?.logoUrl ?? null,
    faviconUrl: demoBranding?.faviconUrl ?? null,
  };
}

export function buildTenantTheme(branding: Pick<TenantBrandingSnapshot, 'themePresetId' | 'themeOverrides'>): ThemePreset {
  return mergeTheme(getThemePreset(branding.themePresetId), (branding.themeOverrides ?? {}) as ThemeOverrides);
}

export function buildTenantRuntimeSurface(branding: Pick<TenantBrandingSnapshot, 'themePresetId' | 'themeOverrides'>) {
  return createThemeRuntimeSurface(buildTenantTheme(branding));
}
