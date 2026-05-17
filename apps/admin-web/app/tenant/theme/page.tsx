import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../session';
import { ThemePresetSwitcher } from '../../theme-preset-switcher';
import { getAdminTenantRecord } from '../../admin-db';
import { SurfaceShell } from '../../surface-shell';

export default async function TenantThemePage() {
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

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Tenant Builder" title="Branding and theme">
        <p>Choose theme presets, typography, navigation, spacing, and image assets. Preview changes live, then save to publish them to the public webapp.</p>
        <p className="form-help">Signed in tenant: {tenant.displayName}</p>
      </ShellCard>
      <ThemePresetSwitcher
        initialPresetId={tenant.themePresetId}
        tenantName={tenant.displayName}
        initialLayoutConfig={tenant.layoutConfig}
        initialThemeOverrides={tenant.themeOverrides}
        initialLogoUrl={tenant.logoUrl}
        initialFaviconUrl={tenant.faviconUrl}
      />
    </SurfaceShell>
  );
}
