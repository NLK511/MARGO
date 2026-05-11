import Link from 'next/link';
import { ShellCard } from '@margo/ui';

const services = [
  { slug: 'dinner-reservation', name: 'Dinner reservation', duration: 90, status: 'active' },
  { slug: 'initial-consultation', name: 'Initial consultation', duration: 45, status: 'active' },
];

export default function BookingServicesPage() {
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Booking" title="Services">
          <p>Create and edit bookable services used by the public availability API.</p>
          <Link className="admin-action" href="/booking/resources">Manage resources</Link>
        </ShellCard>
        <form className="editor-form" aria-label="Create service"><label>Name<input placeholder="Service name" /></label><label>Duration minutes<input type="number" defaultValue={45} /></label><button className="primary-admin-button" type="button">Create service</button></form>
        <div className="admin-table" role="table" aria-label="Services">
          {services.map((service) => <div key={service.slug} className="admin-table-row" role="row"><span>{service.name}</span><span>{service.slug}</span><span>{service.duration} min</span><span>{service.status}</span><span><button>Edit</button></span></div>)}
        </div>
      </section>
    </main>
  );
}
