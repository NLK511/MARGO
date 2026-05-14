import React from 'react';
import { calculateAvailability } from '@margo/db';

export type PublicBookingTenantSlug = 'table-and-co' | 'oak-clinic';

const bookingTenants: Record<PublicBookingTenantSlug, { name: string; title: string; serviceId: string; resourceId: string; resourceLabel: string; duration: number; opensAt: string; closesAt: string; partySize?: number }> = {
  'table-and-co': { name: 'Table & Co', title: 'Reserve a table', serviceId: 'dinner-reservation', resourceId: 'table-2', resourceLabel: 'Table 2', duration: 90, opensAt: '18:00', closesAt: '21:00', partySize: 2 },
  'oak-clinic': { name: 'Oak Clinic', title: 'Book an appointment', serviceId: 'initial-consultation', resourceId: 'clinician-1', resourceLabel: 'Dr. Ada Martin', duration: 45, opensAt: '09:00', closesAt: '12:00' },
};

export function TenantBookingPage({ tenantSlug, showTenantContextWarning = false }: { tenantSlug: PublicBookingTenantSlug; showTenantContextWarning?: boolean }) {
  const tenant = bookingTenants[tenantSlug];
  const slots = calculateAvailability({
    service: { id: tenant.serviceId, durationMinutes: tenant.duration },
    resources: [{ id: tenant.resourceId, active: true, capacity: tenant.partySize ? 4 : undefined }],
    bookings: [],
    date: '2026-05-11',
    partySize: tenant.partySize,
    businessHours: { opensAt: tenant.opensAt, closesAt: tenant.closesAt },
  }).slice(0, 4);

  return (
    <main className="frontpage booking-flow" data-tenant={tenantSlug}>
      <section className="section-card booking-panel">
        <p className="eyebrow">{tenant.name} booking</p>
        <h1>{tenant.title}</h1>
        {showTenantContextWarning ? <p className="form-help">Demo fallback route. Tenant-scoped links use /t/{tenantSlug}/booking.</p> : null}
        <p>Public booking flow MVP with availability-backed slot choices and idempotent booking submission handled by the API layer.</p>

        <form className="booking-details-form" aria-label="Booking details" noValidate>
          <label htmlFor="customerName">Your name</label>
          <input id="customerName" name="customerName" aria-invalid="false" aria-describedby="name-help" autoComplete="name" required />
          <p id="name-help" className="form-help">Required so staff can identify the reservation.</p>

          <label htmlFor="customerEmail">Email</label>
          <input id="customerEmail" name="customerEmail" type="email" aria-invalid="true" aria-describedby="email-error" autoComplete="email" required />
          <p id="email-error" className="form-error" role="alert">Enter a valid email address before submitting.</p>
        </form>

        <div className="booking-columns" aria-live="polite">
          <SlotList title={tenant.title} slots={slots} confirmationToken={`${tenantSlug}-demo`} resourceLabel={tenant.resourceLabel} />
        </div>
      </section>
    </main>
  );
}

function SlotList({ title, slots, confirmationToken, resourceLabel }: { title: string; slots: Array<{ startsAt: Date; resourceId: string }>; confirmationToken: string; resourceLabel: string }) {
  return (
    <article className="service-card">
      <h2>{title}</h2>
      {slots.map((slot) => (
        <a key={`${slot.resourceId}-${slot.startsAt.toISOString()}`} className="slot-link" href={`/booking/confirmation/${confirmationToken}`}>
          {slot.startsAt.toISOString().slice(11, 16)} · {resourceLabel}
        </a>
      ))}
    </article>
  );
}
