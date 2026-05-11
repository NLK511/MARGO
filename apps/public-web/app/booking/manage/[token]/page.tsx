type ManageProps = { params: Promise<{ token: string }> };

export default async function ManageBookingPage({ params }: ManageProps) {
  const { token } = await params;
  return (
    <main className="frontpage booking-flow">
      <section className="section-card booking-panel">
        <p className="eyebrow">Manage booking</p>
        <h1>Manage or cancel your booking</h1>
        <p>Use this public token to cancel without an account: {token}</p>
        <button className="primary-action" type="button">
          Cancel booking
        </button>
      </section>
    </main>
  );
}
