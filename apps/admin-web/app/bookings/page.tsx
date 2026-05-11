import Link from 'next/link';
import { ShellCard } from '@margo/ui';

const bookings = [
  { id: 'bk_restaurant', customer: 'Demo Guest', service: 'Dinner reservation', time: '18:00', status: 'confirmed' },
  { id: 'bk_clinic', customer: 'Demo Patient', service: 'Initial consultation', time: '09:00', status: 'checked_in' },
];

export default function StaffBookingsPage() {
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Booking" title="Calendar lite">
          <p>Staff can review bookings and perform MVP actions: cancel, check-in, and no-show.</p>
          <Link className="admin-action" href="/booking/services">Manage services</Link>
        </ShellCard>
        <div className="admin-table" role="table" aria-label="Bookings">
          <div className="admin-table-row admin-table-head" role="row"><span>Customer</span><span>Service</span><span>Time</span><span>Status</span><span>Actions</span></div>
          {bookings.map((booking) => (
            <div key={booking.id} className="admin-table-row" role="row">
              <span>{booking.customer}</span><span>{booking.service}</span><span>{booking.time}</span><span className="status-pill status-published">{booking.status}</span>
              <span className="table-actions"><button>Check-in</button><button>No-show</button><button>Cancel</button></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
