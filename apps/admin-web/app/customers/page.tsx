import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCrmLabels } from '@margo/db';
import { getTenantAdminDemoData } from '../admin-context';
import { getCurrentDevSession } from '../session';

export default async function CustomersPage() {
  const session = await getCurrentDevSession();
  const labels = getCrmLabels({ profileKind: session.tenantSlug === 'oak-clinic' ? 'patient' : 'customer' });
  const { customers } = getTenantAdminDemoData(session);
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="CRM" title={`${session.tenantName} ${labels.plural}`}>
          <p>Search and manage this tenant's {labels.plural.toLowerCase()} with notes, custom fields, and {labels.bookingPlural.toLowerCase()} history.</p>
          <Link className="admin-action" href="/crm/custom-fields">Custom fields</Link>
        </ShellCard>

        <form className="editor-form" role="search" aria-label={`Search ${labels.plural}`}>
          <label>
            Search {labels.plural.toLowerCase()}
            <input name="q" placeholder="Name, email, or phone" />
          </label>
          <button className="primary-admin-button" type="button">Search</button>
        </form>

        {customers.length === 0 ? (
          <section className="empty-card" aria-live="polite"><h2>No {labels.plural.toLowerCase()} yet</h2><p>This tenant has no CRM records in the demo data.</p></section>
        ) : (
          <div className="admin-table crm-table" role="table" aria-label={labels.plural}>
            <div className="admin-table-row admin-table-head" role="row"><span>{labels.singular}</span><span>Email</span><span>Phone</span><span>Updated</span><span>Profile</span></div>
            {customers.map((customer) => (
              <div key={customer.id} className="admin-table-row" role="row">
                <span>{customer.name}</span><span>{customer.email}</span><span>{customer.phone}</span><span>{customer.updated}</span><span><Link href={`/customers/${customer.id}`}>Open</Link></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
