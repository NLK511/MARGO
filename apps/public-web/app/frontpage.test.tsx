import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { demoFrontpage } from './demo-frontpage';
import { FrontpageShell } from './frontpage';

describe('frontpage rendering', () => {
  it('renders a frontpage-only tenant without booking or CRM links', () => {
    const html = renderToStaticMarkup(<FrontpageShell model={demoFrontpage} />);

    expect(html).toContain('Bistro Lumiere');
    expect(html).not.toContain('Booking</a>');
    expect(html).not.toContain('Client portal');
  });

  it('keeps a mobile layout smoke rule for narrow screens', () => {
    const css = readFileSync(join(process.cwd(), 'app/styles.css'), 'utf8');

    expect(css).toContain('@media (max-width: 720px)');
    expect(css).toContain('grid-template-columns: 1fr;');
  });
});
