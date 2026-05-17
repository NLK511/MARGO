import React from 'react';
import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../../session';
import { getAdminPageInventory, getAdminTenantRecord } from '../../../admin-db';
import { SurfaceShell } from '../../../surface-shell';

export default async function TenantBuilderComposePage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? { displayName: session.tenantName };
  const inventory = await getAdminPageInventory(session.tenantSlug);

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Compose mode" title="Arrange sections and page structure">
        <p>Build the page by adding, reordering, hiding, duplicating, or replacing sections.</p>
        <div className="admin-action-row">
          <Link className="button-link" href="/tenant/pages">Open page inventory</Link>
          <Link className="button-link" href="/tenant/pages/new">Create page draft</Link>
        </div>
      </ShellCard>

      <ShellCard eyebrow="Recommended next section" title="Suggested workflow">
        <p>Start from a hero, then add proof, services, and a clear call to action.</p>
      </ShellCard>

      <ShellCard eyebrow="Manual pages" title={`${tenant.displayName} pages`}>
        <div className="admin-table" role="table" aria-label={`${tenant.displayName} manual pages`}>
          <div className="admin-table-row admin-table-head" role="row">
            <span>Title</span><span>Path</span><span>Status</span><span>Action</span>
          </div>
          {inventory.manualPages.map((page) => (
            <div key={page.id} className="admin-table-row" role="row">
              <span>{page.title}</span>
              <span>{page.path}</span>
              <span className={`status-pill status-${page.status}`}>{page.status}</span>
              <Link href={`/tenant/pages/${page.id}`}>Edit</Link>
            </div>
          ))}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
