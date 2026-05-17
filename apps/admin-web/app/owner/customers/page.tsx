import { ShellCard } from '@margo/ui';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';
import { SurfaceShell } from '../../surface-shell';

export default async function OwnerCustomersPage() {
  const session = await getCurrentDevSession();
  const { customers } = getTenantAdminDemoData(session);
  return (
    <SurfaceShell surface="owner">
      <ShellCard eyebrow="CRM" title={`${session.tenantName} customers`}>
        <p>Tenant-scoped customer records for enabled CRM tenants.</p>
      </ShellCard>
      {customers.length === 0 ? <section className="empty-card"><h2>No customers yet</h2><p>This tenant has no customer records in the demo data.</p></section> : (
        <div className="admin-table" role="table" aria-label={`${session.tenantName} customers`}>
          <div className="admin-table-row admin-table-head" role="row"><span>Name</span><span>Email</span><span>Phone</span><span>Updated</span></div>
          {customers.map((customer) => <div key={customer.id} className="admin-table-row" role="row"><span>{customer.name}</span><span>{customer.email}</span><span>{customer.phone}</span><span>{customer.updated}</span></div>)}
        </div>
      )}
    </SurfaceShell>
  );
}
