import { headers } from 'next/headers';
import { resolveTenantContext } from '@margo/core';
import { createPrismaTenantResolverRepository, createQuoteRequestService } from '@margo/db';

export async function getQuoteRequestPageModel(tenantSlug: string) {
  const tenant = await createPrismaTenantResolverRepository().findBySlug(tenantSlug);
  if (!tenant || !tenant.enabledModules.includes('quote-request')) return null;

  const config = await createQuoteRequestService().getConfig({ tenantId: tenant.tenantId });
  return toPageModel(tenant, config);
}

export async function getQuoteRequestPageForCurrentRequest() {
  const requestHeaders = await headers();
  const tenant = await resolveTenantContext(
    { hostname: requestHeaders.get('host'), path: requestHeaders.get('x-margo-path') ?? '/quote-request', baseDomains: (process.env.MARGO_BASE_DOMAINS ?? '').split(',').filter(Boolean) },
    createPrismaTenantResolverRepository(),
  );

  if (tenant) {
    if (!tenant.enabledModules.includes('quote-request')) return null;
    const config = await createQuoteRequestService().getConfig({ tenantId: tenant.tenantId });
    return toPageModel(tenant, config);
  }

  return getQuoteRequestPageModel('maison-noire');
}

export async function getQuoteRequestConfirmationModel(tenantSlug: string, publicToken: string) {
  const tenant = await createPrismaTenantResolverRepository().findBySlug(tenantSlug);
  if (!tenant || !tenant.enabledModules.includes('quote-request')) return null;

  const request = await createQuoteRequestService().getRequestByToken({ tenantId: tenant.tenantId, publicToken });
  if (!request) return null;

  return toConfirmationModel(tenant, request);
}

export async function getQuoteRequestConfirmationForCurrentRequest(publicToken: string) {
  const requestHeaders = await headers();
  const tenant = await resolveTenantContext(
    { hostname: requestHeaders.get('host'), path: requestHeaders.get('x-margo-path') ?? '/quote-request', baseDomains: (process.env.MARGO_BASE_DOMAINS ?? '').split(',').filter(Boolean) },
    createPrismaTenantResolverRepository(),
  );

  if (tenant) {
    if (!tenant.enabledModules.includes('quote-request')) return null;
    const request = await createQuoteRequestService().getRequestByToken({ tenantId: tenant.tenantId, publicToken });
    if (request) return toConfirmationModel(tenant, request);
    return null;
  }

  return getQuoteRequestConfirmationModel('maison-noire', publicToken);
}

function toPageModel(tenant: { slug: string; displayName?: string; themePresetId?: string; layoutConfig?: Record<string, unknown>; themeOverrides?: Record<string, unknown>; logoUrl?: string | null; faviconUrl?: string | null; enabledModules: string[] }, config: Awaited<ReturnType<ReturnType<typeof createQuoteRequestService>['getConfig']>>) {
  return {
    tenant: {
      slug: tenant.slug,
      displayName: tenant.displayName ?? tenant.slug,
      themePresetId: tenant.themePresetId ?? 'clinical-calm',
      layoutConfig: tenant.layoutConfig,
      themeOverrides: tenant.themeOverrides,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      enabledModules: tenant.enabledModules,
    },
    config,
  };
}

function toConfirmationModel(tenant: { slug: string; displayName?: string; themePresetId?: string; layoutConfig?: Record<string, unknown>; themeOverrides?: Record<string, unknown>; logoUrl?: string | null; faviconUrl?: string | null; enabledModules: string[] }, request: NonNullable<Awaited<ReturnType<ReturnType<typeof createQuoteRequestService>['getRequestByToken']>>>) {
  return {
    tenant: {
      slug: tenant.slug,
      displayName: tenant.displayName ?? tenant.slug,
      themePresetId: tenant.themePresetId ?? 'clinical-calm',
      layoutConfig: tenant.layoutConfig,
      themeOverrides: tenant.themeOverrides,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      enabledModules: tenant.enabledModules,
    },
    request,
  };
}
