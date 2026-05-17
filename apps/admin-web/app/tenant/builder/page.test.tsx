import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../surface-shell', () => ({ SurfaceShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@margo/ui', () => ({
  ShellCard: ({ title, eyebrow, children }: { title?: string; eyebrow?: string; children: React.ReactNode }) => (
    <section>
      <h2>{eyebrow}</h2>
      <h3>{title}</h3>
      {children}
    </section>
  ),
}));
vi.mock('../../session', () => ({ getCurrentDevSession: vi.fn(async () => ({ tenantSlug: 'oak-clinic', tenantName: 'Oak Clinic', enabledModules: [], roles: ['tenant_admin'] })) }));
vi.mock('../../admin-db', () => ({ getAdminTenantRecord: vi.fn(async () => ({ displayName: 'Oak Clinic', enabledModules: [] })) }));

import TenantBuilderHubPage from './page';

describe('tenant builder hub', () => {
  it('renders the guided workflow entry points', async () => {
    const html = renderToStaticMarkup(await TenantBuilderHubPage());
    expect(html).toContain('builder workflow');
    expect(html).toContain('/tenant/builder/compose');
    expect(html).toContain('/tenant/builder/content');
    expect(html).toContain('/tenant/builder/style');
  });
});
