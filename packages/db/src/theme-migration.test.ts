import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { migrateThemeCatalog, normalizeLegacyThemeOverrides, writeThemeMigrationReport } from './theme-migration';
import { themeCatalog } from './theme-catalog';

function createClient() {
  return {
    tenant: {
      findMany: vi.fn(async () => [
        { id: 'tenant-1', slug: 'oak-clinic' },
        { id: 'tenant-2', slug: 'maison-noire' },
      ]),
    },
    tenantBranding: {
      findMany: vi.fn(async () => [
        {
          tenantId: 'tenant-1',
          themePresetId: 'clinical-calm',
          themeOverrides: { layout: { nav: 'overlay' }, custom: 'drop-me' },
        },
        {
          tenantId: 'tenant-2',
          themePresetId: 'missing-theme',
          themeOverrides: 'not-an-object',
        },
      ]),
    },
    themeFamily: {
      upsert: vi.fn(async () => undefined),
    },
    themeVersion: {
      upsert: vi.fn(async () => undefined),
    },
    tenantThemeAssignment: {
      findUnique: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === 'tenant-1'
          ? { themeFamilyId: 'clinical-calm', themeVersionId: 'clinical-calm@1.0.0', recipeVariation: { layout: { nav: 'overlay' } } }
          : null,
      ),
      upsert: vi.fn(async () => undefined),
    },
  };
}

describe('theme migration helpers', () => {
  it('normalizes legacy overrides and reports dropped keys', () => {
    const normalized = normalizeLegacyThemeOverrides({ layout: { nav: 'overlay' }, custom: true } as never);

    expect(normalized.overrides).toEqual({ layout: { nav: 'overlay' } });
    expect(normalized.droppedKeys).toEqual(['custom']);
    expect(normalized.warnings.join(' ')).toContain('Dropped unsupported override keys');
  });

  it('writes a structured migration report', () => {
    const directory = mkdtempSync(join(tmpdir(), 'margo-theme-migration-'));
    const reportPath = join(directory, 'report.json');
    const report = {
      generatedAt: new Date('2026-05-11T00:00:00.000Z').toISOString(),
      summary: {
        tenantCount: 1,
        familyCount: themeCatalog.length,
        versionCount: themeCatalog.length,
        assignmentCount: 1,
        converted: 1,
        preserved: 0,
        dropped: 0,
        warnings: 0,
      },
      tenants: [],
      warnings: [],
    };

    writeThemeMigrationReport(report, reportPath);

    expect(JSON.parse(readFileSync(reportPath, 'utf8'))).toEqual(report);
    rmSync(directory, { recursive: true, force: true });
  });

  it('migrates tenants with preserve/convert reporting and fallback warnings', async () => {
    const client = createClient();
    const logger = { info: vi.fn(), warn: vi.fn() };

    const report = await migrateThemeCatalog(client as never, { logger });

    expect(report.summary.tenantCount).toBe(2);
    expect(report.summary.familyCount).toBe(themeCatalog.length);
    expect(report.summary.converted).toBe(1);
    expect(report.summary.preserved).toBe(1);
    expect(report.summary.dropped).toBe(1);
    expect(report.summary.warnings).toBeGreaterThan(0);
    expect(report.tenants[0]?.status).toBe('preserved');
    expect(report.tenants[1]?.resolvedPresetId).toBe('clinical-calm');
    expect(logger.warn).toHaveBeenCalled();
    expect(client.themeFamily.upsert).toHaveBeenCalled();
    expect(client.tenantThemeAssignment.upsert).toHaveBeenCalledTimes(2);
  });
});
