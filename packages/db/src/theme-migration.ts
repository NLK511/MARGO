import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';
import { mapLegacyThemePreset, resolveThemeCatalogItem, themeCatalog } from './theme-catalog';

const defaultPrisma = new PrismaClient();

type ThemeOverrides = {
  colors?: Record<string, unknown>;
  typography?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  assets?: Record<string, unknown>;
};

const supportedLegacyOverrideKeys = ['colors', 'typography', 'layout', 'assets'] as const;

export interface ThemeMigrationReport {
  generatedAt: string;
  summary: ThemeMigrationSummary;
  tenants: ThemeMigrationTenantReport[];
  warnings: string[];
}

export interface ThemeMigrationSummary {
  tenantCount: number;
  familyCount: number;
  versionCount: number;
  assignmentCount: number;
  converted: number;
  preserved: number;
  dropped: number;
  warnings: number;
}

export interface ThemeMigrationTenantReport {
  tenantId: string;
  tenantSlug: string;
  sourcePresetId: string;
  resolvedPresetId: string;
  themeFamilyId: string;
  themeVersionId: string;
  status: 'converted' | 'preserved';
  droppedKeys: string[];
  warnings: string[];
}

export interface ThemeMigrationOptions {
  client?: ThemeMigrationClient;
  reportPath?: string;
  dryRun?: boolean;
  now?: Date;
  logger?: Pick<Console, 'info' | 'warn'>;
}

export interface ThemeMigrationClient {
  tenant: {
    findMany(args: unknown): Promise<Array<{ id: string; slug: string }>>;
  };
  tenantBranding: {
    findMany(args: unknown): Promise<Array<{ tenantId: string; themePresetId: string | null; themeOverrides: Prisma.JsonValue | null }>>;
  };
  themeFamily: {
    upsert(args: { where: { id: string }; update: Record<string, unknown>; create: Record<string, unknown> }): Promise<unknown>;
  };
  themeVersion: {
    upsert(args: { where: { id: string }; update: Record<string, unknown>; create: Record<string, unknown> }): Promise<unknown>;
  };
  tenantThemeAssignment: {
    findUnique(args: { where: { tenantId: string } }): Promise<{ themeFamilyId: string; themeVersionId: string; recipeVariation: Prisma.JsonValue | null } | null>;
    upsert(args: { where: { tenantId: string }; update: Record<string, unknown>; create: Record<string, unknown> }): Promise<unknown>;
  };
}

export async function runThemeMigration(options: ThemeMigrationOptions = {}): Promise<ThemeMigrationReport> {
  const client = options.client ?? (defaultPrisma as unknown as ThemeMigrationClient);
  const report = await migrateThemeCatalog(client, {
    dryRun: options.dryRun ?? false,
    now: options.now ?? new Date(),
    logger: options.logger ?? console,
  });

  if (options.reportPath) {
    writeThemeMigrationReport(report, options.reportPath);
  }

  options.logger?.info(
    `Theme migration ${options.dryRun ? 'dry-run' : 'complete'}: ${report.summary.converted} converted, ${report.summary.preserved} preserved, ${report.summary.dropped} dropped, ${report.summary.warnings} warnings.`,
  );

  return report;
}

export async function migrateThemeCatalog(
  client: ThemeMigrationClient,
  options: { dryRun?: boolean; now?: Date; logger?: Pick<Console, 'info' | 'warn'> } = {},
): Promise<ThemeMigrationReport> {
  const dryRun = options.dryRun ?? false;
  const now = options.now ?? new Date();
  const logger = options.logger ?? console;
  const warnings: string[] = [];
  const tenantReports: ThemeMigrationTenantReport[] = [];

  for (const preset of themeCatalog) {
    const mapping = mapLegacyThemePreset(preset.id);
    if (!dryRun) {
      await client.themeFamily.upsert({
        where: { id: mapping.family.id },
        update: {
          name: mapping.family.name,
          description: mapping.family.description ?? null,
          verticalFit: ['generic'] as Prisma.InputJsonValue,
          personality: mapping.family.personality,
        },
        create: {
          id: mapping.family.id,
          name: mapping.family.name,
          description: mapping.family.description ?? null,
          verticalFit: ['generic'] as Prisma.InputJsonValue,
          personality: mapping.family.personality,
        },
      });
      await client.themeVersion.upsert({
        where: { id: mapping.version.id },
        update: {
          themeFamilyId: mapping.family.id,
          version: mapping.version.version,
          lifecycle: mapping.version.lifecycle,
          recipe: mapping.recipe as Prisma.InputJsonValue,
          migrationNotes: { sourcePresetId: preset.id, migratedAt: now.toISOString() } as Prisma.InputJsonValue,
        },
        create: {
          id: mapping.version.id,
          themeFamilyId: mapping.family.id,
          version: mapping.version.version,
          lifecycle: mapping.version.lifecycle,
          recipe: mapping.recipe as Prisma.InputJsonValue,
          migrationNotes: { sourcePresetId: preset.id, migratedAt: now.toISOString() } as Prisma.InputJsonValue,
        },
      });
    }
  }

  const tenants = await client.tenant.findMany({ select: { id: true, slug: true } });
  const brandings = await client.tenantBranding.findMany({ select: { tenantId: true, themePresetId: true, themeOverrides: true } });
  const brandingByTenantId = new Map(brandings.map((branding) => [branding.tenantId, branding] as const));

  for (const tenant of tenants) {
    const branding = brandingByTenantId.get(tenant.id);
    const fallbackWarnings: string[] = [];
    const resolvedPreset = resolveThemeCatalogItem(branding?.themePresetId, (warning) => {
      fallbackWarnings.push(warning);
      logger.warn?.(warning);
    });
    const normalizedOverrides = normalizeLegacyThemeOverrides(branding?.themeOverrides);
    const mapping = mapLegacyThemePreset(resolvedPreset.preset.id, normalizedOverrides.overrides);
    const assignmentVariation = Object.keys(normalizedOverrides.overrides).length ? (normalizedOverrides.overrides as unknown as Prisma.InputJsonValue) : null;
    const assignmentVariationForWrite = assignmentVariation ?? Prisma.DbNull;
    const existingAssignment = await readExistingAssignment(client, tenant.id);
    const preserved =
      existingAssignment !== null &&
      existingAssignment.themeFamilyId === mapping.family.id &&
      existingAssignment.themeVersionId === mapping.version.id &&
      stableStringify(existingAssignment.recipeVariation) === stableStringify(assignmentVariation);

    const droppedKeys = [...normalizedOverrides.droppedKeys];
    if (resolvedPreset.usedFallback && branding?.themePresetId) {
      warnings.push(`Tenant ${tenant.slug} uses unknown theme preset "${branding.themePresetId}"; fallback ${resolvedPreset.preset.id} applied.`);
    }
    if (normalizedOverrides.warnings.length) {
      warnings.push(...normalizedOverrides.warnings.map((message) => `Tenant ${tenant.slug}: ${message}`));
    }
    if (!dryRun) {
      await client.tenantThemeAssignment.upsert({
        where: { tenantId: tenant.id },
        update: {
          themeFamilyId: mapping.family.id,
          themeVersionId: mapping.version.id,
          recipeVariation: assignmentVariationForWrite,
        },
        create: {
          tenantId: tenant.id,
          themeFamilyId: mapping.family.id,
          themeVersionId: mapping.version.id,
          recipeVariation: assignmentVariationForWrite,
        },
      });
    }

    tenantReports.push({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      sourcePresetId: branding?.themePresetId ?? resolvedPreset.preset.id,
      resolvedPresetId: resolvedPreset.preset.id,
      themeFamilyId: mapping.family.id,
      themeVersionId: mapping.version.id,
      status: preserved ? 'preserved' : 'converted',
      droppedKeys,
      warnings: [...normalizedOverrides.warnings, ...fallbackWarnings],
    });
  }

  return {
    generatedAt: now.toISOString(),
    summary: {
      tenantCount: tenants.length,
      familyCount: themeCatalog.length,
      versionCount: themeCatalog.length,
      assignmentCount: tenantReports.length,
      converted: tenantReports.filter((item) => item.status === 'converted').length,
      preserved: tenantReports.filter((item) => item.status === 'preserved').length,
      dropped: tenantReports.reduce((count, item) => count + item.droppedKeys.length, 0),
      warnings: warnings.length,
    },
    tenants: tenantReports,
    warnings,
  };
}

export function writeThemeMigrationReport(report: ThemeMigrationReport, reportPath: string): void {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

export function resolveThemeMigrationReportPath(startDir = process.cwd()): string {
  let current = startDir;
  while (true) {
    if (existsSync(resolve(current, 'pnpm-workspace.yaml'))) {
      return resolve(current, '.margo', 'theme-migration-report.json');
    }
    const parent = dirname(current);
    if (parent === current) {
      return resolve(startDir, '.margo', 'theme-migration-report.json');
    }
    current = parent;
  }
}

export function normalizeLegacyThemeOverrides(value: Prisma.JsonValue | null | undefined): { overrides: ThemeOverrides; droppedKeys: string[]; warnings: string[] } {
  if (!isPlainObject(value)) {
    return { overrides: {}, droppedKeys: [], warnings: value == null ? [] : ['Theme overrides were not an object and were ignored.'] };
  }

  const overrides: ThemeOverrides = {};
  const droppedKeys: string[] = [];
  const warnings: string[] = [];

  for (const key of Object.keys(value)) {
    if ((supportedLegacyOverrideKeys as readonly string[]).includes(key)) {
      const rawValue = value[key];
      if (isPlainObject(rawValue) || Array.isArray(rawValue)) {
        (overrides as Record<string, unknown>)[key] = rawValue;
      } else {
        warnings.push(`Override key "${key}" was ignored because it is not an object.`);
      }
    } else {
      droppedKeys.push(key);
    }
  }

  if (droppedKeys.length) {
    warnings.push(`Dropped unsupported override keys: ${droppedKeys.join(', ')}.`);
  }

  return { overrides, droppedKeys, warnings };
}

async function readExistingAssignment(client: ThemeMigrationClient, tenantId: string): Promise<{ themeFamilyId: string; themeVersionId: string; recipeVariation: Prisma.JsonValue | null } | null> {
  try {
    return await client.tenantThemeAssignment.findUnique({ where: { tenantId } });
  } catch (error) {
    if (isMissingThemeTableError(error)) return null;
    throw error;
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeJsonValue(value));
}

function normalizeJsonValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = normalizeJsonValue((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}

function isMissingThemeTableError(error: unknown): boolean {
  return error !== null && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2021';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function mainThemeMigration(argv = process.argv.slice(2)): Promise<void> {
  const dryRun = argv.includes('--dry-run');
  const reportIndex = argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? argv[reportIndex + 1] : undefined;
  const finalReportPath = reportPath ?? resolveThemeMigrationReportPath();
  const report = await runThemeMigration({ dryRun, reportPath: finalReportPath, logger: console });
  console.info(
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        summary: report.summary,
        reportPath: finalReportPath,
      },
      null,
      2,
    ),
  );
}

if (import.meta.url === new URL(process.argv[1] ?? '', 'file:').href) {
  await mainThemeMigration().finally(async () => {
    await defaultPrisma.$disconnect();
  });
}
