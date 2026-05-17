import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../session';
import { SurfaceShell } from '../../surface-shell';

type OwnerQuoteRequestRow = { id: string; leadName: string; status: string; quoteMinor?: number | null; currency?: string | null; submittedAt: string };

export default async function OwnerQuoteRequestsPage() {
  const session = await getCurrentDevSession();
  const quoteRequests: OwnerQuoteRequestRow[] = [];
  return (
    <SurfaceShell surface="owner">
      <ShellCard eyebrow="Leads" title={`${session.tenantName} quote requests`}>
        <p>Review tenant-scoped incoming quote requests without exposing builder settings.</p>
      </ShellCard>
      {quoteRequests.length === 0 ? <section className="empty-card"><h2>No quote requests yet</h2><p>This tenant has no quote requests yet.</p></section> : (
        <div className="admin-table" role="table" aria-label="Recent quote requests">
          <div className="admin-table-row admin-table-head" role="row"><span>Lead</span><span>Status</span><span>Total</span><span>Submitted</span></div>
          {quoteRequests.map((request) => <div key={request.id} className="admin-table-row" role="row"><span>{request.leadName}</span><span>{request.status}</span><span>{request.quoteMinor ? `${request.currency} ${(request.quoteMinor / 100).toFixed(2)}` : '—'}</span><span>{request.submittedAt}</span></div>)}
        </div>
      )}
    </SurfaceShell>
  );
}
