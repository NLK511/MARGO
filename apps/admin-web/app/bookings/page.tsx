import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getTenantAdminDemoData } from '../admin-context';
import { getCurrentDevSession } from '../session';

export default async function StaffBookingsPage() {
  const session = await getCurrentDevSession();
  const { bookings } = getTenantAdminDemoData(session);
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Booking" title={`${session.tenantName} calendar lite`}>
          <p>Staff can review only this tenant's bookings and perform MVP actions: cancel, check-in, and no-show.</p>
          <Link className="admin-action" href="/booking/services">Manage services</Link>
        </ShellCard>
        {bookings.length === 0 ? (
          <section className="empty-card" aria-live="polite"><h2>No bookings yet</h2><p>This tenant has no booking records in the demo data.</p></section>
        ) : (
          <div className="admin-table" role="table" aria-label={`${session.tenantName} bookings`}>
            <div className="admin-table-row admin-table-head" role="row"><span>Customer</span><span>Service</span><span>Time</span><span>Status</span><span>Actions</span></div>
            {bookings.map((booking) => (
              <div key={booking.id} className="admin-table-row" role="row">
                <span>{booking.customer}</span><span>{booking.service}</span><span>{booking.time}</span><span className="status-pill status-published">{booking.status}</span>
                <span className="table-actions"><button>Check-in</button><button>No-show</button><button>Cancel</button></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
