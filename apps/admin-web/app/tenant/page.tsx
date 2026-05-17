import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../session';
import { getAdminTenantRecord } from '../admin-db';
import { SurfaceShell } from '../surface-shell';

export default async function TenantBuilderHomePage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? {
    displayName: session.tenantName,
    enabledModules: session.enabledModules,
  };

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Tenant Builder" title={`${tenant.displayName} builder`}>
        <p>Configure this tenant webapp without mixing builder tools with owner operations.</p>
        <div className="admin-action-row">
          <Link className="button-link" href="/tenant/theme">Edit branding and theme</Link>
          <Link className="button-link" href="/tenant/modules">Manage modules</Link>
          <Link className="button-link" href="/tenant/pages">Edit public pages</Link>
        </div>
      </ShellCard>
      <ShellCard eyebrow="Current setup" title="Enabled modules">
        <p className="form-help">{tenant.enabledModules.join(', ') || 'No modules enabled yet.'}</p>
      </ShellCard>
    </SurfaceShell>
  );
}
