import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { demoFrontpage } from '../../apps/public-web/app/demo-frontpage';
import { FrontpageShell } from '../../apps/public-web/app/frontpage';
import PublicBookingPage from '../../apps/public-web/app/booking/page';

const paths = vi.hoisted(() => ({
  surfaceShell: new URL('../../apps/admin-web/app/surface-shell.tsx', import.meta.url).pathname,
  session: new URL('../../apps/admin-web/app/session.ts', import.meta.url).pathname,
  adminDb: new URL('../../apps/admin-web/app/admin-db.ts', import.meta.url).pathname,
  themeStore: new URL('../../apps/admin-web/app/global-admin/theme-studio/theme-studio-store.ts', import.meta.url).pathname,
  themePresetSwitcher: new URL('../../apps/admin-web/app/theme-preset-switcher.tsx', import.meta.url).pathname,
}));

vi.mock(paths.surfaceShell, () => ({ SurfaceShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@margo/ui', () => ({
  ShellCard: ({ title, eyebrow, children }: { title?: string; eyebrow?: string; children: React.ReactNode }) => (
    <section>
      <h2>{eyebrow}</h2>
      <h3>{title}</h3>
      {children}
    </section>
  ),
}));
vi.mock(paths.session, () => ({ getCurrentDevSession: vi.fn(async () => ({ userId: 'u1', roles: ['tenant_admin'], tenantSlug: 'oak-clinic', enabledModules: [], tenantName: 'Oak Clinic', tenantId: 'tenant-1', displayName: 'Admin' })) }));
vi.mock(paths.adminDb, () => ({ getAdminTenantRecord: vi.fn(async () => ({ displayName: 'Oak Clinic', enabledModules: [] })), getAdminPageInventory: vi.fn(async () => ({ manualPages: [], modulePages: [] })) }));
vi.mock(paths.themeStore, () => ({
  listThemeStudioFamilies: vi.fn(() => [
    { id: 'clinical-calm', name: 'Clinical Calm', sourcePresetId: 'clinical-calm', lifecycle: 'published', canPublish: true, isBuiltIn: true },
  ]),
}));
vi.mock(paths.themePresetSwitcher, () => ({ ThemePresetSwitcher: () => <div aria-label="Theme presets">Theme controls</div> }));

import TenantBuilderStylePage from '../../apps/admin-web/app/tenant/builder/style/page';
import ThemeStudioPage from '../../apps/admin-web/app/global-admin/theme-studio/page';

describe('surface accessibility', () => {
  it('keeps the public homepage and booking flows labeled', () => {
    const html = renderToStaticMarkup(<FrontpageShell model={demoFrontpage} />) + renderToStaticMarkup(<PublicBookingPage />);

    expect(html).toContain('aria-label="Public site navigation"');
    expect(html).toContain('aria-label="Booking details"');
    expect(html).toContain('for="customerName"');
    expect(html).toContain('role="alert"');
  });

  it('keeps builder and theme studio controls labeled', async () => {
    const builderHtml = renderToStaticMarkup(await TenantBuilderStylePage());
    const studioHtml = renderToStaticMarkup(await ThemeStudioPage());

    expect(builderHtml).toContain('Style mode');
    expect(builderHtml).toContain('aria-label="Preview device switcher"');
    expect(studioHtml).toContain('aria-label="Theme families"');
    expect(studioHtml).toContain('Create draft family');
    expect(studioHtml).toContain('Theme preview fixtures');
  });
});
