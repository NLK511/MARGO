import React from 'react';
import Link from 'next/link';
import { ShellCard } from '@margo/ui';
import { getCurrentDevSession } from '../../session';
import { getAdminTenantRecord } from '../../admin-db';
import { SurfaceShell } from '../../surface-shell';

export default async function TenantBuilderHubPage() {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? {
    displayName: session.tenantName,
    enabledModules: session.enabledModules,
  };

  return (
    <SurfaceShell surface="tenant">
      <ShellCard eyebrow="Tenant Builder" title={`${tenant.displayName} builder workflow`}>
        <p>Use the guided builder to compose pages, edit content, and adjust styling without exposing raw low-level knobs.</p>
        <div className="admin-action-row">
          <Link className="button-link" href="/tenant/builder/compose">Compose</Link>
          <Link className="button-link" href="/tenant/builder/content">Content</Link>
          <Link className="button-link" href="/tenant/builder/style">Style</Link>
        </div>
      </ShellCard>
      <ShellCard eyebrow="Guided workflow" title="What each mode does">
        <div className="admin-grid three-columns">
          <article className="admin-card">
            <h3>Compose</h3>
            <p>Arrange sections, duplicate blocks, and choose recommended follow-up sections.</p>
          </article>
          <article className="admin-card">
            <h3>Content</h3>
            <p>Fill in page copy, media, SEO, and required fields for each block.</p>
          </article>
          <article className="admin-card">
            <h3>Style</h3>
            <p>Choose preset-based branding controls, live preview sizes, and publish-safe theme settings.</p>
          </article>
        </div>
      </ShellCard>
      <ShellCard eyebrow="Current setup" title="Enabled modules">
        <p className="form-help">{tenant.enabledModules.join(', ') || 'No modules enabled yet.'}</p>
      </ShellCard>
    </SurfaceShell>
  );
}
