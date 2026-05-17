import { createCarouselPresetProps } from '@margo/core';
import { prisma, createPublicPageService } from '@margo/db';
import { moduleRegistry } from '@margo/modules';

export interface AdminTenantRecord {
  tenantId: string;
  slug: string;
  displayName: string;
  enabledModules: string[];
  themePresetId: string;
  layoutConfig: Record<string, unknown>;
  themeOverrides: Record<string, unknown>;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

export async function getAdminTenantRecord(tenantSlug: string): Promise<AdminTenantRecord | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: { modules: true, branding: true },
  });

  if (!tenant) return null;

  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    displayName: tenant.displayName ?? tenant.slug,
    enabledModules: tenant.modules.filter((module) => module.enabled).map((module) => module.moduleId),
    themePresetId: tenant.branding?.themePresetId ?? 'clinical-calm',
    layoutConfig: (isPlainObject(tenant.branding?.layoutConfig) ? tenant.branding.layoutConfig : {}) as Record<string, unknown>,
    themeOverrides: (isPlainObject(tenant.branding?.themeOverrides) ? tenant.branding.themeOverrides : {}) as Record<string, unknown>,
    logoUrl: tenant.branding?.logoUrl,
    faviconUrl: tenant.branding?.faviconUrl,
  };
}

export async function getAdminPageInventory(tenantSlug: string): Promise<AdminPageInventory> {
  const tenant = await getAdminTenantRecord(tenantSlug);
  if (!tenant) return { manualPages: [], modulePages: [] };

  const pages = await prisma.publicPage.findMany({
    where: { tenantId: tenant.tenantId },
    select: { id: true, slug: true, locale: true, title: true, status: true, updatedAt: true, seo: true },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

  return buildAdminPageInventory(tenant, pages);
}

export interface AdminPageInventory {
  manualPages: AdminPageInventoryItem[];
  modulePages: AdminPageInventoryItem[];
}

export interface AdminPageInventoryItem {
  id: string;
  title: string;
  path: string;
  source: 'manual' | 'module';
  status?: 'draft' | 'published';
  seoTitle?: string;
  editable: boolean;
  moduleId?: string;
  moduleName?: string;
  routePattern?: string;
}

export function buildAdminPageInventory(
  tenant: Pick<AdminTenantRecord, 'slug' | 'enabledModules'>,
  pages: Array<{ id: string; slug: string; locale: string; title: string; status: string; seo: unknown }>,
): AdminPageInventory {
  const manualPages = pages.map((page) => ({
    id: page.id,
    title: page.title,
    path: formatPublicPagePath(page.locale, page.slug),
    source: 'manual' as const,
    status: page.status as 'draft' | 'published',
    seoTitle: getSeoTitle(page.seo, page.title),
    editable: true,
  }));

  const modulePages = moduleRegistry
    .enabledManifests(tenant.enabledModules)
    .filter((manifest) => manifest.id !== 'frontpage')
    .flatMap((manifest) =>
      manifest.publicRoutes.map((route) => ({
        id: `${manifest.id}:${route.path}`,
        title: manifest.name,
        path: formatModuleRoutePath(route.path, tenant.slug),
        source: 'module' as const,
        editable: false,
        moduleId: manifest.id,
        moduleName: manifest.name,
        routePattern: route.path,
      })),
    );

  return { manualPages, modulePages };
}

export async function getAdminPageRecord(tenantSlug: string, pageId: string) {
  const tenant = await getAdminTenantRecord(tenantSlug);
  if (!tenant || pageId === 'new') return null;

  const page = await createPublicPageService().findPageForAdmin({ tenantId: tenant.tenantId, pageId });
  return page ? injectMaisonNoireCarousel(tenant.slug, page) : null;
}

function injectMaisonNoireCarousel(tenantSlug: string, page: Awaited<ReturnType<ReturnType<typeof createPublicPageService>['findPageForAdmin']>>) {
  if (!page || tenantSlug !== 'maison-noire') return page;
  if (page.blocks.some((block) => block.type === 'carousel')) return page;

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
  };

  const blocks = [...page.blocks];
  const heroIndex = blocks.findIndex((block) => block.type === 'hero');
  const insertAt = heroIndex >= 0 ? heroIndex + 1 : 0;
  blocks.splice(insertAt, 0, carouselBlock as never);
  return { ...page, blocks };
}

export function getModuleSettingsFromModules(enabledModules: string[]) {
  return moduleRegistry.manifests.map((manifest) => ({
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    enabled: enabledModules.includes(manifest.id),
    dependencies: manifest.dependencies,
  }));
}

function formatPublicPagePath(locale: string, slug: string): string {
  return slug === 'home' ? `/${locale}` : `/${locale}/${slug}`;
}

function formatModuleRoutePath(path: string, tenantSlug: string): string {
  return path.replace(':tenantSlug', tenantSlug);
}

function getSeoTitle(seo: unknown, fallback: string): string {
  return isPlainObject(seo) && typeof seo.title === 'string' ? seo.title : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
