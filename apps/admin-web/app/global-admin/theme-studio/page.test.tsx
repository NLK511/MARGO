import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../surface-shell', () => ({ SurfaceShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@margo/ui', () => ({ ShellCard: ({ title, eyebrow, children }: { title?: string; eyebrow?: string; children: React.ReactNode }) => <section><h2>{eyebrow}</h2><h3>{title}</h3>{children}</section> }));

import ThemeStudioPage from './page';

describe('theme studio page', () => {
  it('renders the curated controls and preview matrix', async () => {
    const html = renderToStaticMarkup(await ThemeStudioPage());

    expect(html).toContain('Theme Studio');
    expect(html).toContain('Create draft family');
    expect(html).toContain('Curated controls');
    expect(html).toContain('Theme preview fixtures');
  });
});
