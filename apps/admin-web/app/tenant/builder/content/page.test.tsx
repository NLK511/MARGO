import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../surface-shell', () => ({ SurfaceShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@margo/ui', () => ({
  ShellCard: ({ title, eyebrow, children }: { title?: string; eyebrow?: string; children: React.ReactNode }) => (
    <section>
      <h2>{eyebrow}</h2>
      <h3>{title}</h3>
      {children}
    </section>
  ),
}));
vi.mock('../../../session', () => ({ getCurrentDevSession: vi.fn(async () => ({ tenantSlug: 'oak-clinic', tenantName: 'Oak Clinic', enabledModules: [], roles: ['tenant_admin'] })) }));
vi.mock('../../../admin-db', () => ({ getAdminPageInventory: vi.fn(async () => ({ manualPages: [{ id: 'home', title: 'Homepage', path: '/home', status: 'published', seoTitle: 'Homepage', source: 'manual', editable: true }], modulePages: [] })) }));

import TenantBuilderContentPage from './page';

describe('tenant builder content page', () => {
  it('renders the content checklist and page inventory', async () => {
    const html = renderToStaticMarkup(await TenantBuilderContentPage());
    expect(html).toContain('Content mode');
    expect(html).toContain('Content checklist');
    expect(html).toContain('Homepage');
  });
});
