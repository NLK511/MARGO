import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Prisma, PrismaClient } from '@prisma/client';

export interface DemoSeedSnapshotFile {
  tenants: Record<string, DemoTenantSeedSnapshot>;
}

export interface DemoTenantSeedSnapshot {
  slug: string;
  branding?: DemoTenantBrandingSnapshot;
  moduleSettings?: DemoTenantModuleSettingSnapshot[];
  quoteRequest?: DemoTenantModuleSettingSnapshot;
  pages?: DemoTenantPageSnapshot[];
}

export interface DemoTenantBrandingSnapshot {
  themePresetId?: string | null;
  layoutConfig?: Record<string, unknown>;
  themeOverrides?: Record<string, unknown>;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

export interface DemoTenantModuleSettingSnapshot {
  moduleId: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface DemoTenantPageSnapshot {
  locale: string;
  slug: string;
  title: string;
  seo: Record<string, unknown>;
  status: string;
  layoutPreset: string;
  blocks: Array<{
    type: string;
    variant: string;
    props: Prisma.JsonValue;
    position: number;
  }>;
}

type DemoSeedSnapshotClient = Pick<PrismaClient, 'tenant' | 'tenantBranding' | 'tenantModule' | 'publicPage'>;

type DemoSeedSnapshotOptions = {
  snapshotPath?: string;
  startDir?: string;
};

export function loadDemoSeedSnapshot(options: DemoSeedSnapshotOptions = {}): DemoSeedSnapshotFile {
  const snapshotPath = options.snapshotPath ?? resolveDemoSeedSnapshotPath(options.startDir ?? process.cwd());
  if (!existsSync(snapshotPath)) return { tenants: {} };

  try {
    const raw = JSON.parse(readFileSync(snapshotPath, 'utf8')) as unknown;
    const tenants = isPlainObject(raw) && isPlainObject(raw.tenants) ? (raw.tenants as Record<string, DemoTenantSeedSnapshot>) : {};
    return { tenants };
  } catch {
    return { tenants: {} };
  }
}

export async function syncDemoTenantSeedSnapshot(
  client: DemoSeedSnapshotClient,
  tenantId: string,
  options: DemoSeedSnapshotOptions = {},
): Promise<void> {
  const tenant = await client.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
  if (!tenant) return;

  const [branding, moduleSettings, pages] = await Promise.all([
    client.tenantBranding.findUnique({ where: { tenantId } }),
    client.tenantModule.findMany({ where: { tenantId }, orderBy: [{ moduleId: 'asc' }] }),
    client.publicPage.findMany({
      where: { tenantId },
      orderBy: [{ locale: 'asc' }, { slug: 'asc' }],
      include: { blocks: { orderBy: { position: 'asc' } } },
    }),
  ]);

  const normalizedModuleSettings = moduleSettings.map((module) => ({
    moduleId: module.moduleId,
    enabled: module.enabled,
    config: toRecord(module.config),
  }));

  const quoteRequest = normalizedModuleSettings.find((module) => module.moduleId === 'quote-request');
  const snapshot = loadDemoSeedSnapshot(options);
  snapshot.tenants[tenant.slug] = {
    slug: tenant.slug,
    ...(branding
      ? {
          branding: {
            themePresetId: branding.themePresetId,
            layoutConfig: toRecord(branding.layoutConfig),
            themeOverrides: toRecord(branding.themeOverrides),
            logoUrl: branding.logoUrl,
            faviconUrl: branding.faviconUrl,
          },
        }
      : {}),
    moduleSettings: normalizedModuleSettings,
    ...(quoteRequest ? { quoteRequest } : {}),
    pages: pages.map((page) => ({
      locale: page.locale,
      slug: page.slug,
      title: page.title,
      seo: toRecord(page.seo),
      status: page.status,
      layoutPreset: page.layoutPreset,
      blocks: page.blocks.map((block) => ({
        type: block.type,
        variant: block.variant,
        props: block.props,
        position: block.position,
      })),
    })),
  };

  writeDemoSeedSnapshot(snapshot, options);
}

export function writeDemoSeedSnapshot(snapshot: DemoSeedSnapshotFile, options: DemoSeedSnapshotOptions = {}): void {
  const snapshotPath = options.snapshotPath ?? resolveDemoSeedSnapshotPath(options.startDir ?? process.cwd());
  mkdirSync(dirname(snapshotPath), { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
}

export function resolveDemoSeedSnapshotPath(startDir = process.cwd()): string {
  const repoRoot = resolveRepoRoot(startDir);
  return resolve(repoRoot, '.margo', 'demo-seed-state.json');
}

function resolveRepoRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(resolve(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? (value as Record<string, unknown>) : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
