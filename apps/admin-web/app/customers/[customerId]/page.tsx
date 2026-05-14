import { notFound } from 'next/navigation';
import { ShellCard } from '@margo/ui';
import { getCrmLabels } from '@margo/db';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';

type CustomerProfileProps = { params: Promise<{ customerId: string }> };

export default async function CustomerProfilePage({ params }: CustomerProfileProps) {
  const { customerId } = await params;
  const session = await getCurrentDevSession();
  const labels = getCrmLabels({ profileKind: session.tenantSlug === 'oak-clinic' ? 'patient' : 'customer' });
  const data = getTenantAdminDemoData(session);
  const customer = data.customers.find((item) => item.id === customerId);
  if (!customer) notFound();

  const timeline = [
    { id: 'booking-created', title: `${labels.bookingSingular} booked`, body: `${data.bookings[0]?.service ?? 'Demo booking'} · ${data.bookings[0]?.time ?? '09:00'}`, when: 'Today' },
    { id: 'seed-note', title: 'Note added', body: `Seed note for ${session.tenantName} CRM demo.`, when: 'Yesterday' },
  ];

  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack profile-layout">
        <ShellCard eyebrow="CRM" title={customer.name}>
          <p>{labels.singular} ID: {customer.id}</p>
          <p>Email: {customer.email}</p>
          <p>Phone: {customer.phone}</p>
        </ShellCard>

        <form className="editor-form note-form" aria-label={`Add ${labels.singular.toLowerCase()} note`}>
          <label>
            Add internal note
            <textarea placeholder="Write a concise note for the care team" defaultValue="" />
          </label>
          <button className="primary-admin-button" type="button">Add note</button>
        </form>

        <section className="timeline-card" aria-label={`${labels.singular} timeline`}>
          <h2>{labels.bookingPlural} and notes timeline</h2>
          {timeline.map((item) => (
            <article key={item.id} className="timeline-item">
              <span>{item.when}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
