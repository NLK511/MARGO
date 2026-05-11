import { ShellCard } from '@margo/ui';
import { getCrmLabels } from '@margo/db';

type CustomerProfileProps = { params: Promise<{ customerId: string }> };

const labels = getCrmLabels({ profileKind: 'patient' });
const timeline = [
  { id: 'booking-created', title: `${labels.bookingSingular} booked`, body: 'Initial consultation · 09:00', when: 'Today' },
  { id: 'seed-note', title: 'Note added', body: 'Seed note for clinic CRM demo.', when: 'Yesterday' },
];

export default async function CustomerProfilePage({ params }: CustomerProfileProps) {
  const { customerId } = await params;
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack profile-layout">
        <ShellCard eyebrow="CRM" title={`Demo ${labels.singular}`}>
          <p>{labels.singular} ID: {customerId}</p>
          <p>Email: patient@oakclinic.example</p>
          <p>Phone: +33 1 23 45 67 89</p>
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
