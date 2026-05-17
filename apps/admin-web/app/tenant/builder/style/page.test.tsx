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
vi.mock('../../../session', () => ({ getCurrentDevSession: vi.fn(async () => ({ tenantSlug: 'oak-clinic', tenantName: 'Oak Clinic', tenantId: 'tenant-1', enabledModules: [], roles: ['tenant_admin'] })) }));
vi.mock('../../../admin-db', () => ({ getAdminTenantRecord: vi.fn(async () => ({ tenantId: 'tenant-1', slug: 'oak-clinic', displayName: 'Oak Clinic', enabledModules: [], themePresetId: 'clinical-calm', layoutConfig: {}, themeOverrides: {}, logoUrl: null, faviconUrl: null })) }));
vi.mock('../../../theme-preset-switcher', () => ({ ThemePresetSwitcher: () => <div>Theme controls</div> }));
vi.mock('../builder-preview-device-switcher', () => ({ BuilderPreviewDeviceSwitcher: ({ children }: { children: React.ReactNode }) => <div>Device switcher{children}</div> }));

import TenantBuilderStylePage from './page';

describe('tenant builder style page', () => {
  it('renders the curated style workflow', async () => {
    const html = renderToStaticMarkup(await TenantBuilderStylePage());
    expect(html).toContain('Style mode');
    expect(html).toContain('Device switcher');
    expect(html).toContain('Theme controls');
  });
});
