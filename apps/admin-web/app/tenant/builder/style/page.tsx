import React from 'react';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../../session';
import { getAdminTenantRecord } from '../../../admin-db';
import { SurfaceShell } from '../../../surface-shell';
import { ThemePresetSwitcher } from '../../../theme-preset-switcher';
import { BuilderPreviewDeviceSwitcher } from '../builder-preview-device-switcher';
import { resolveThemePresetWithStudioOverrides } from '@margo/themes/theme-studio-overrides';

export default async function TenantBuilderStylePage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? {
    tenantId: session.tenantId,
    slug: session.tenantSlug,
    displayName: session.tenantName,
    enabledModules: session.enabledModules,
    themePresetId: 'clinical-calm',
    layoutConfig: {},
    themeOverrides: {},
    logoUrl: null,
    faviconUrl: null,
  };

  const resolvedThemePreset = resolveThemePresetWithStudioOverrides(tenant.themePresetId, undefined, process.cwd());

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Style mode" title="Branding and layout">
        <p>Pick approved theme presets, tune curated layout controls, and preview changes before saving.</p>
      </ShellCard>
      <BuilderPreviewDeviceSwitcher>
        <ThemePresetSwitcher
          initialPresetId={tenant.themePresetId}
          initialResolvedPreset={resolvedThemePreset}
          tenantName={tenant.displayName}
          initialLayoutConfig={tenant.layoutConfig}
          initialThemeOverrides={tenant.themeOverrides}
          initialLogoUrl={tenant.logoUrl}
          initialFaviconUrl={tenant.faviconUrl}
        />
      </BuilderPreviewDeviceSwitcher>
    </SurfaceShell>
  );
}
