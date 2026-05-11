import { headers } from 'next/headers';
import { resolveTenantContext } from '@margo/core';
import { createPrismaTenantResolverRepository, createPublicPageService } from '@margo/db';
import type { TenantFrontpageModel } from './frontpage';

export async function getFrontpageForCurrentRequest(path = '/') {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  return getFrontpageForHostAndPath(host, path);
}

export async function getFrontpageForHostAndPath(hostname: string | null, path: string): Promise<TenantFrontpageModel | null> {
  const tenant = await resolveTenantContext(
    { hostname, path, baseDomains: (process.env.MARGO_BASE_DOMAINS ?? '').split(',').filter(Boolean) },
    createPrismaTenantResolverRepository(),
  );

  if (!tenant || !tenant.enabledModules.includes('frontpage')) {
    return null;
  }

  const page = await createPublicPageService().findPublishedPage({ tenantId: tenant.tenantId, slug: 'home', locale: tenant.locale });
  if (!page) return null;

  return {
    tenant: {
      slug: tenant.slug,
      displayName: tenant.displayName ?? tenant.slug,
      enabledModules: tenant.enabledModules,
      themePresetId: tenant.themePresetId ?? 'clinical-calm',
    },
    page,
  };
}
