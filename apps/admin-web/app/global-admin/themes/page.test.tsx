import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../surface-shell', () => ({ SurfaceShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@margo/ui', () => ({ ShellCard: ({ title, eyebrow, children }: { title?: string; eyebrow?: string; children: React.ReactNode }) => <section><h2>{eyebrow}</h2><h3>{title}</h3>{children}</section> }));

import GlobalThemesPage from './page';

describe('global themes page', () => {
  it('links each preset to the theme studio editor', () => {
    const html = renderToStaticMarkup(<GlobalThemesPage />);

    expect(html).toContain('White-label theme inventory');
    expect(html).toContain('Edit theme');
    expect(html).toContain('/global-admin/theme-studio?theme=');
  });
});
