import { ShellCard } from '@margo/ui';
import { createQuoteRequestService, type QuoteRequestRecord } from '@margo/db';
import { getCurrentDevSession } from '../session';
import { getAdminTenantRecord } from '../admin-db';
import { QuoteRequestModuleEditor } from './quote-request-module-editor';

export default async function QuoteRequestsPage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? {
    tenantId: session.tenantId,
    slug: session.tenantSlug,
    displayName: session.tenantName,
    enabledModules: session.enabledModules,
    themePresetId: 'clinical-calm',
    layoutConfig: {},
    themeOverrides: {},
    logoUrl: null,
    faviconUrl: null,
  };
  const service = createQuoteRequestService();
  const [config, requests] = await Promise.all([
    service.getConfig({ tenantId: tenant.tenantId }),
    service.listRequests({ tenantId: tenant.tenantId, take: 12 }),
  ]);

  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Quote request" title={`${tenant.displayName} wizard`}>
          <p>Configure the guided quote request wizard, including the form style and next-step animation, plus recipient email and output mode.</p>
          <p className="form-help">Lead capture is stored as quote requests and can also seed CRM customers when CRM is enabled.</p>
        </ShellCard>

        <QuoteRequestModuleEditor initialConfig={config} />

        <ShellCard eyebrow="Leads" title="Recent quote requests">
          <QuoteRequestList requests={requests} currency={config.currency} />
        </ShellCard>
      </section>
    </main>
  );
}

function QuoteRequestList({ requests, currency }: { requests: QuoteRequestRecord[]; currency: string }) {
  if (!requests.length) {
    return <p className="form-help">No quote requests yet.</p>;
  }

  return (
    <div className="admin-table" role="table" aria-label="Recent quote requests">
      {requests.map((request) => (
        <div key={request.id} className="admin-table-row" role="row">
          <span>{request.requesterName}</span>
          <span>{request.requesterEmail ?? '—'}</span>
          <span>{request.outputMode}</span>
          <span>{formatQuoteMinor(request.quoteMinor, currency)}</span>
          <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

function formatQuoteMinor(value: number | null | undefined, currency: string): string {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value / 100);
}
