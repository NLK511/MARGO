import { ShellCard } from '@margo/ui';

export default function AdminHomePage() {
  return (
    <main className="page-shell">
      <ShellCard eyebrow="Admin web" title="MARGO tenant operations">
        <p>
          This split admin app will host tenant settings, page management, bookings, CRM, and RBAC-gated operational screens.
        </p>
      </ShellCard>
    </main>
  );
}
