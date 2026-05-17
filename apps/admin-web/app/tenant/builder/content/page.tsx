import React from 'react';
import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../../session';
import { getAdminPageInventory } from '../../../admin-db';
import { SurfaceShell } from '../../../surface-shell';

export default async function TenantBuilderContentPage() {
  const session = await getCurrentDevSession();
  const inventory = await getAdminPageInventory(session.tenantSlug);

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Content mode" title="Fill in page copy and media">
        <p>Use the page editor for structured content fields, alt text, and SEO metadata.</p>
        <div className="admin-action-row">
          <Link className="button-link" href="/tenant/pages/new">Start a new page</Link>
          <Link className="button-link" href="/tenant/pages">Browse pages</Link>
        </div>
      </ShellCard>

      <ShellCard eyebrow="Content checklist" title="Required before publish">
        <ul>
          <li>Headline, body, and CTA text are complete.</li>
          <li>Images have alt text and appropriate crops.</li>
          <li>SEO title and description are filled in.</li>
        </ul>
      </ShellCard>

      <ShellCard eyebrow="Page inventory" title="Edit an existing page">
        <div className="admin-table" role="table" aria-label="Page inventory">
          <div className="admin-table-row admin-table-head" role="row">
            <span>Title</span><span>Slug</span><span>Status</span><span>Action</span>
          </div>
          {inventory.manualPages.map((page) => (
            <div key={page.id} className="admin-table-row" role="row">
              <span>{page.title}</span>
              <span>{page.path}</span>
              <span className={`status-pill status-${page.status}`}>{page.status}</span>
              <Link href={`/tenant/pages/${page.id}`}>Open editor</Link>
            </div>
          ))}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
