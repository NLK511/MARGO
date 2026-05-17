import { NextResponse } from 'next/server';
import { prisma, syncDemoTenantSeedSnapshot } from '@margo/db';
import { getCurrentDevSession } from '../../session';
import { getAdminTenantRecord } from '../../admin-db';
import { assertValidThemePreset, getThemePreset, mergeTheme, type ThemeOverrides } from '@margo/themes';

type JsonObject = Record<string, unknown>;
type BrandingJsonValue = NonNullable<Parameters<typeof prisma.tenantBranding.upsert>[0]['create']['layoutConfig']>;

export async function PATCH(request: Request) {
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as BrandingPayload | null;
  const themePresetId = body?.themePresetId?.trim();
  if (!themePresetId) return NextResponse.json({ message: 'Theme preset is required.' }, { status: 400 });

  const currentBranding = await prisma.tenantBranding.findUnique({ where: { tenantId: tenant.tenantId } });
  const layoutConfig = normalizeObject(body?.layoutConfig) ?? normalizeObject(currentBranding?.layoutConfig) ?? tenant.layoutConfig ?? {};
  const themeOverrides = normalizeObject(body?.themeOverrides) ?? normalizeObject(currentBranding?.themeOverrides) ?? tenant.themeOverrides ?? {};

  const nextTheme = mergeTheme(getThemePreset(themePresetId), themeOverrides as ThemeOverrides);
  try {
    assertValidThemePreset(nextTheme);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Theme preset is invalid.';
    return NextResponse.json({ message }, { status: 400 });
  }

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.tenantId },
    update: {
      themePresetId,
      logoUrl: normalizeNullableString(body?.logoUrl),
      faviconUrl: normalizeNullableString(body?.faviconUrl),
      themeOverrides: themeOverrides as BrandingJsonValue,
      layoutConfig: layoutConfig as BrandingJsonValue,
    },
    create: {
      tenantId: tenant.tenantId,
      themePresetId,
      logoUrl: normalizeNullableString(body?.logoUrl) ?? null,
      faviconUrl: normalizeNullableString(body?.faviconUrl) ?? null,
      themeOverrides: themeOverrides as BrandingJsonValue,
      layoutConfig: layoutConfig as BrandingJsonValue,
    },
  });

  await syncDemoTenantSeedSnapshot(prisma, tenant.tenantId).catch((error) => {
    console.warn('Failed to persist demo tenant snapshot after theme update.', error);
  });

  return NextResponse.json({
    tenantId: tenant.tenantId,
    themePresetId,
    logoUrl: normalizeNullableString(body?.logoUrl),
    faviconUrl: normalizeNullableString(body?.faviconUrl),
    layoutConfig,
    themeOverrides,
  });
}

type BrandingPayload = {
  themePresetId?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  layoutConfig?: unknown;
  themeOverrides?: unknown;
};

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null;
}
