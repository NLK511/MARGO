import { headers } from 'next/headers';
import type { TenantFrontpageModel } from './frontpage';

export async function getFrontpageForCurrentRequest(path = '/') {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  return getFrontpageForHostAndPath(host, path);
}

export async function getFrontpageForHostAndPath(hostname: string | null, path: string): Promise<TenantFrontpageModel | null> {
  const { resolveTenantContext } = await import('@margo/core');
  const { createPrismaTenantResolverRepository, createPublicPageService } = await import('@margo/db');

  const tenant = await resolveTenantContext(
    { hostname, path, baseDomains: (process.env.MARGO_BASE_DOMAINS ?? '').split(',').filter(Boolean) },
    createPrismaTenantResolverRepository(),
  );

  if (!tenant || !tenant.enabledModules.includes('frontpage')) {
    return null;
  }

  const route = parsePublicPageRoute(path);
  const pageLocale = route?.locale ?? tenant.locale;
  const pageSlug = route?.pageSlug ?? 'home';
  const publicPageService = createPublicPageService();
  const page =
    tenant.resolutionMethod === 'development-prefix'
      ? await publicPageService.findPageBySlug({ tenantId: tenant.tenantId, slug: pageSlug, locale: pageLocale })
      : await publicPageService.findPublishedPage({ tenantId: tenant.tenantId, slug: pageSlug, locale: pageLocale });
  if (!page) return null;

  return {
    tenant: {
      slug: tenant.slug,
      locale: tenant.locale,
      displayName: tenant.displayName ?? tenant.slug,
      enabledModules: tenant.enabledModules,
      themePresetId: tenant.themePresetId ?? 'clinical-calm',
      layoutConfig: tenant.layoutConfig,
      themeOverrides: tenant.themeOverrides,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      homeHref: tenant.resolutionMethod === 'development-prefix' ? `/t/${tenant.slug}` : `/${tenant.locale}`,
    },
    page: await injectMaisonNoireCarousel(tenant.slug, page),
  };
}

export function parsePublicPageRoute(path: string): { locale: string; pageSlug?: string } | null {
  const normalized = path.replace(/\/+$/, '') || '/';
  if (normalized === '/') return null;

  const match = normalized.match(/^\/([^/?#]+)(?:\/([^/?#]+))?$/);
  if (!match?.[1]) return null;
  if (match[1] === 't') return null;

  return { locale: decodeURIComponent(match[1]), pageSlug: match[2] ? decodeURIComponent(match[2]) : 'home' };
}

async function injectMaisonNoireCarousel(tenantSlug: string, page: TenantFrontpageModel['page']): Promise<TenantFrontpageModel['page']> {
  if (tenantSlug !== 'maison-noire') return page;
  if (page.blocks.some((block) => block.type === 'carousel')) return page;

  const { createCarouselPresetProps } = await import('@margo/core');
  const carouselBlock = {
    id: 'carousel-maison-noire',
    type: 'carousel',
    variant: 'testimonials',
    position: 1,
    props: createCarouselPresetProps('testimonials', {
      eyebrow: 'Guest notes',
      title: 'A few reasons guests return',
      body: 'A premium carousel preset for polished social proof and memorable touches.',
    }),
  } as const;

  const blocks = [...page.blocks];
  const heroIndex = blocks.findIndex((block) => block.type === 'hero');
  const insertAt = heroIndex >= 0 ? heroIndex + 1 : 0;
  blocks.splice(insertAt, 0, carouselBlock as never);
  return { ...page, blocks };
}
