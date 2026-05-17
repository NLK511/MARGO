import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../session';
import { getAdminTenantRecord, getModuleSettingsFromModules } from '../../admin-db';
import { ModuleSettingsEditor } from '../../module-settings-editor';
import { SurfaceShell } from '../../surface-shell';

export default async function TenantModulesPage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? {
    tenantId: session.tenantId,
    slug: session.tenantSlug,
    displayName: session.tenantName,
    enabledModules: session.enabledModules,
  };
  const modules = getModuleSettingsFromModules(tenant.enabledModules);

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Tenant Builder" title="Tenant modules">
        <p>Enable or disable optional modules for this tenant webapp. Required dependencies are enabled automatically.</p>
        <p className="form-help">Disabled module routes are hidden from the shell and blocked by guards.</p>
        <ModuleSettingsEditor tenantId={tenant.tenantId} tenantSlug={tenant.slug} modules={modules} />
      </ShellCard>
    </SurfaceShell>
  );
}
