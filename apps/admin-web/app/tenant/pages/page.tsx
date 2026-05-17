import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../session';
import { getAdminPageInventory, getAdminTenantRecord } from '../../admin-db';

export default async function AdminPagesList() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? { tenantId: session.tenantId, displayName: session.tenantName };
  const inventory = await getAdminPageInventory(session.tenantSlug);
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Frontpage" title={`${tenant.displayName} pages`}>
          <p>Manual pages stay editable here. Module-owned pages are shown in the same inventory, but are locked and configured from their dedicated module editors.</p>
          <Link className="admin-action" href="/tenant/pages/new">New page</Link>
        </ShellCard>

        <section className="admin-substack">
          <h2 className="admin-section-title">Manually created pages</h2>
          <div className="admin-table" role="table" aria-label={`${tenant.displayName} manual pages`}>
            <div className="admin-table-row admin-table-head" role="row">
              <span>Title</span><span>Path</span><span>Status</span><span>SEO title</span><span>Action</span>
            </div>
            {inventory.manualPages.map((page) => (
              <div key={page.id} className="admin-table-row" role="row">
                <span>{page.title}</span><span>{page.path}</span><span className={`status-pill status-${page.status}`}>{page.status}</span><span>{page.seoTitle}</span><Link href={`/tenant/pages/${page.id}`}>Edit</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-substack">
          <h2 className="admin-section-title">Injected by modules</h2>
          <div className="admin-table" role="table" aria-label={`${tenant.displayName} module pages`}>
            <div className="admin-table-row admin-table-head" role="row">
              <span>Page</span><span>Path</span><span>Module</span><span>Source</span><span>Action</span>
            </div>
            {inventory.modulePages.map((page) => (
              <div key={page.id} className="admin-table-row" role="row">
                <span>{page.title}</span>
                <span>
                  {page.path}
                  {page.routePattern && page.routePattern !== page.path ? <small className="muted-note">{page.routePattern}</small> : null}
                </span>
                <span>{page.moduleName}</span>
                <span className="status-pill status-draft">Locked</span>
                <span>Managed by {page.moduleName}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
