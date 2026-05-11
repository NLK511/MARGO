import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCrmLabels } from '@margo/db';

const labels = getCrmLabels({ profileKind: 'patient' });
const customers = [
  { id: 'demo-patient', name: 'Demo Patient', email: 'patient@oakclinic.example', phone: '+33 1 23 45 67 89', updated: 'Today' },
  { id: 'follow-up-patient', name: 'Follow-up Patient', email: 'followup@oakclinic.example', phone: '+33 1 98 76 54 32', updated: 'Yesterday' },
];

export default function CustomersPage() {
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="CRM" title={labels.plural}>
          <p>Search and manage {labels.plural.toLowerCase()} with notes, custom fields, and {labels.bookingPlural.toLowerCase()} history.</p>
          <Link className="admin-action" href="/crm/custom-fields">Custom fields</Link>
        </ShellCard>

        <form className="editor-form" role="search" aria-label={`Search ${labels.plural}`}>
          <label>
            Search {labels.plural.toLowerCase()}
            <input name="q" placeholder="Name, email, or phone" />
          </label>
          <button className="primary-admin-button" type="button">Search</button>
        </form>

        <div className="admin-table crm-table" role="table" aria-label={labels.plural}>
          <div className="admin-table-row admin-table-head" role="row"><span>{labels.singular}</span><span>Email</span><span>Phone</span><span>Updated</span><span>Profile</span></div>
          {customers.map((customer) => (
            <div key={customer.id} className="admin-table-row" role="row">
              <span>{customer.name}</span><span>{customer.email}</span><span>{customer.phone}</span><span>{customer.updated}</span><span><Link href={`/customers/${customer.id}`}>Open</Link></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
