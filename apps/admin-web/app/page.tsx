import { ShellCard } from '@margo/ui';
import { ThemePresetSwitcher } from './theme-preset-switcher';

const demoTenantBranding = {
  tenantSlug: 'oak-clinic',
  displayName: 'Oak Clinic',
  themePresetId: 'clinical-calm',
};

export default function AdminHomePage() {
  return (
    <main className="page-shell">
      <section className="admin-grid">
        <ShellCard eyebrow="Admin web" title="Branding preview">
          <p>
            Tenant admins can choose a theme preset and preview the exact runtime tokens that will be persisted to tenant branding.
          </p>
          <p className="form-help">Demo tenant: {demoTenantBranding.displayName}</p>
        </ShellCard>

        <ThemePresetSwitcher initialPresetId={demoTenantBranding.themePresetId} tenantName={demoTenantBranding.displayName} />
      </section>
    </main>
  );
}
