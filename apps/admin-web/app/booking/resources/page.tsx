import { ShellCard } from '@margo/ui';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';

export default async function BookingResourcesPage() {
  const session = await getCurrentDevSession();
  const { resources } = getTenantAdminDemoData(session);
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Booking" title={`${session.tenantName} resources`}>
          <p>Manage this tenant's tables, rooms, clinicians, or other resources that can receive bookings.</p>
        </ShellCard>
        <form className="editor-form" aria-label="Create resource"><label>Name<input placeholder="Resource name" /></label><label>Type<input placeholder="table, room, clinician" /></label><label>Capacity<input type="number" /></label><button className="primary-admin-button" type="button">Create resource</button></form>
        <div className="admin-table" role="table" aria-label={`${session.tenantName} resources`}>
          {resources.map((resource) => <div key={resource.name} className="admin-table-row" role="row"><span>{resource.name}</span><span>{resource.type}</span><span>{resource.capacity}</span><span>{resource.status}</span><span><button>Edit</button></span></div>)}
        </div>
      </section>
    </main>
  );
}
