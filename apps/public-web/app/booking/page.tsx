import React from 'react';
import { calculateAvailability } from '@margo/db';

const restaurantSlots = calculateAvailability({
  service: { id: 'dinner-reservation', durationMinutes: 90 },
  resources: [
    { id: 'table-2', active: true, capacity: 4 },
    { id: 'table-3', active: true, capacity: 6 },
  ],
  bookings: [],
  date: '2026-05-11',
  partySize: 2,
  businessHours: { opensAt: '18:00', closesAt: '21:00' },
}).slice(0, 4);

const clinicSlots = calculateAvailability({
  service: { id: 'initial-consultation', durationMinutes: 45 },
  resources: [{ id: 'clinician-1', active: true }],
  bookings: [],
  date: '2026-05-11',
  businessHours: { opensAt: '09:00', closesAt: '12:00' },
}).slice(0, 4);

export default function PublicBookingPage() {
  return (
    <main className="frontpage booking-flow">
      <section className="section-card booking-panel">
        <p className="eyebrow">Booking</p>
        <h1>Choose a time</h1>
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
          <SlotList title="Restaurant smoke" slots={restaurantSlots} confirmationToken="restaurant-demo" />
          <SlotList title="Clinic smoke" slots={clinicSlots} confirmationToken="clinic-demo" />
        </div>
      </section>
    </main>
  );
}

function SlotList({ title, slots, confirmationToken }: { title: string; slots: Array<{ startsAt: Date; resourceId: string }>; confirmationToken: string }) {
  return (
    <article className="service-card">
      <h2>{title}</h2>
      {slots.map((slot) => (
        <a key={`${slot.resourceId}-${slot.startsAt.toISOString()}`} className="slot-link" href={`/booking/confirmation/${confirmationToken}`}>
          {slot.startsAt.toISOString().slice(11, 16)} · {slot.resourceId}
        </a>
      ))}
    </article>
  );
}
