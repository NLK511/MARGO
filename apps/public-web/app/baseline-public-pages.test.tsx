import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { demoFrontpage } from './demo-frontpage';
import { FrontpageShell } from './frontpage';

function model(slug: string, displayName: string, themePresetId: string) {
  return {
    ...demoFrontpage,
    tenant: {
      ...demoFrontpage.tenant,
      slug,
      displayName,
      themePresetId,
      homeHref: `/t/${slug}`,
    },
  };
}

describe('baseline public page snapshots', () => {
  it('captures the seeded tenant homepage markup', () => {
    const html = renderToStaticMarkup(<FrontpageShell model={model('bistro-frontpage', 'Bistro Lumiere', 'editorial-bistro')} />);
    expect(html).toContain('Bistro Lumiere');
    expect(html).toContain('href="/t/bistro-frontpage"');
    expect(html).toContain('layout-editorial');
    expect(html).toContain('hero-panel');
    expect(html).toContain('carousel-block');
  });
});
