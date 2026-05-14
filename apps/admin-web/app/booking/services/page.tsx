import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';

export default async function BookingServicesPage() {
  const session = await getCurrentDevSession();
  const { services } = getTenantAdminDemoData(session);
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Booking" title={`${session.tenantName} services`}>
          <p>Create and edit bookable services scoped to the signed-in tenant.</p>
          <Link className="admin-action" href="/booking/resources">Manage resources</Link>
        </ShellCard>
        <form className="editor-form" aria-label="Create service"><label>Name<input placeholder="Service name" /></label><label>Duration minutes<input type="number" defaultValue={45} /></label><button className="primary-admin-button" type="button">Create service</button></form>
        <div className="admin-table" role="table" aria-label={`${session.tenantName} services`}>
          {services.map((service) => <div key={service.slug} className="admin-table-row" role="row"><span>{service.name}</span><span>{service.slug}</span><span>{service.duration} min</span><span>{service.status}</span><span><button>Edit</button></span></div>)}
        </div>
      </section>
    </main>
  );
}
