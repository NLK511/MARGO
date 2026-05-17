import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';
import { SurfaceShell } from '../../surface-shell';

export default async function OwnerBookingsPage() {
  const session = await getCurrentDevSession();
  const { bookings } = getTenantAdminDemoData(session);
  return (
    <SurfaceShell surface="owner">
      <ShellCard eyebrow="Booking" title={`${session.tenantName} calendar lite`}>
        <p>Owners and staff can review only this tenant's bookings and perform MVP actions.</p>
        <Link className="admin-action" href="/tenant/booking/services">Configure services</Link>
      </ShellCard>
      {bookings.length === 0 ? <section className="empty-card"><h2>No bookings yet</h2><p>This tenant has no booking records in the demo data.</p></section> : (
        <div className="admin-table" role="table" aria-label={`${session.tenantName} bookings`}>
          <div className="admin-table-row admin-table-head" role="row"><span>Customer</span><span>Service</span><span>Time</span><span>Status</span><span>Actions</span></div>
          {bookings.map((booking) => <div key={booking.id} className="admin-table-row" role="row"><span>{booking.customer}</span><span>{booking.service}</span><span>{booking.time}</span><span className="status-pill status-published">{booking.status}</span><span className="table-actions"><button>Check-in</button><button>No-show</button><button>Cancel</button></span></div>)}
        </div>
      )}
    </SurfaceShell>
  );
}
