type ConfirmationProps = { params: Promise<{ token: string }> };

export default async function BookingConfirmationPage({ params }: ConfirmationProps) {
  const { token } = await params;
  return (
    <main className="frontpage booking-flow">
      <section className="section-card booking-panel">
        <p className="eyebrow">Confirmed</p>
        <h1>Your booking is confirmed</h1>
        <p>Confirmation token: {token}</p>
        <a className="primary-action" href={`/booking/manage/${token}`}>
          Manage or cancel booking
        </a>
      </section>
    </main>
  );
}
