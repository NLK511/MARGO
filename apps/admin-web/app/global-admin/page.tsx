import { ShellCard } from '@margo/ui';
import { DEMO_TENANTS } from '@margo/core';
import { SurfaceShell } from '../surface-shell';

export default function GlobalStudioPage() {
  const tenants = Object.values(DEMO_TENANTS);
  return (
    <SurfaceShell surface="global-admin">
      <ShellCard eyebrow="Global Studio" title="Tenant inventory">
        <p>Internal platform-owner surface for tenants, templates, themes, lifecycle, and support tools.</p>
        <div className="admin-action-row">
          <a className="button-link" href="/global-admin/theme-studio">Open Theme Studio</a>
          <a className="button-link" href="/global-admin/themes">View theme inventory</a>
        </div>
        <div className="admin-table" role="table" aria-label="Tenants">
          <div className="admin-table-row admin-table-head" role="row">
            <span>Tenant</span><span>Slug</span><span>Modules</span>
          </div>
          {tenants.map((tenant) => (
            <div key={tenant.slug} className="admin-table-row" role="row">
              <span>{tenant.tenantName}</span><span>{tenant.slug}</span><span>{tenant.enabledModules.join(', ')}</span>
            </div>
          ))}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
