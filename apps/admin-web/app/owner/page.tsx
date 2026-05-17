import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../session';
import { getAdminTenantRecord } from '../admin-db';
import { getTenantAdminDemoData } from '../admin-context';
import { SurfaceShell } from '../surface-shell';

export default async function OwnerPortalHomePage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? { displayName: session.tenantName, enabledModules: session.enabledModules };
  const data = getTenantAdminDemoData(session);

  return (
    <SurfaceShell surface="owner">
      <ShellCard eyebrow="Operations" title={`${tenant.displayName} owner dashboard`}>
        <p>Operate enabled modules without exposing website builder or global studio controls.</p>
        <div className="metric-grid">
          <div><strong>{data.bookings.length}</strong><span>Bookings</span></div>
          <div><strong>{data.customers.length}</strong><span>Customers</span></div>
          <div><strong>{tenant.enabledModules.includes('quote-request') ? 'On' : 'Off'}</strong><span>Quote requests</span></div>
        </div>
      </ShellCard>
      <ShellCard eyebrow="Next actions" title="Operational shortcuts">
        <div className="admin-action-row">
          {tenant.enabledModules.includes('booking') ? <Link className="button-link" href="/owner/bookings">View bookings</Link> : null}
          {tenant.enabledModules.includes('crm') ? <Link className="button-link" href="/owner/customers">View customers</Link> : null}
          {tenant.enabledModules.includes('quote-request') ? <Link className="button-link" href="/owner/quote-requests">View quote requests</Link> : null}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
