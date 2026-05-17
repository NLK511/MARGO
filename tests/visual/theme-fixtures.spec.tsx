import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { themePreviewFixtures } from '../../packages/design/src/fixtures/theme-preview-fixtures';

const paths = vi.hoisted(() => ({
  surfaceShell: new URL('../../apps/admin-web/app/surface-shell.tsx', import.meta.url).pathname,
  session: new URL('../../apps/admin-web/app/session.ts', import.meta.url).pathname,
  themeStore: new URL('../../apps/admin-web/app/global-admin/theme-studio/theme-studio-store.ts', import.meta.url).pathname,
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
vi.mock(paths.session, () => ({ getCurrentDevSession: vi.fn(async () => ({ userId: 'u1', roles: ['global_admin'], tenantSlug: 'oak-clinic', enabledModules: [], tenantName: 'Oak Clinic', tenantId: 'tenant-1', displayName: 'Admin' })) }));
vi.mock(paths.themeStore, () => ({
  listThemeStudioFamilies: vi.fn(() => [
    { id: 'clinical-calm', name: 'Clinical Calm', sourcePresetId: 'clinical-calm', lifecycle: 'published', canPublish: true, isBuiltIn: true },
  ]),
}));

import ThemeStudioPage from '../../apps/admin-web/app/global-admin/theme-studio/page';

describe('theme visual fixtures', () => {
  it('renders every curated preview fixture in the theme studio matrix', async () => {
    const html = renderToStaticMarkup(await ThemeStudioPage());
    for (const fixture of themePreviewFixtures) {
      expect(html).toContain(fixture.id);
      expect(html).toContain(fixture.title);
    }
  });
});
