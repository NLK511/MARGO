import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createThemeRuntimeSurface, getThemePreset } from '../../packages/themes/src';
import { demoFrontpage } from '../../apps/public-web/app/demo-frontpage';
import { FrontpageShell } from '../../apps/public-web/app/frontpage';

describe('public preview parity', () => {
  it('keeps public rendering aligned with the shared runtime compiler', () => {
    const model = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        slug: 'maison-noire',
        displayName: 'Maison Noire',
        themePresetId: 'luxury-dark-dining',
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);
    const runtime = createThemeRuntimeSurface(getThemePreset('luxury-dark-dining'));

    expect(html).toContain(runtime.className);
    expect(html).toContain(`data-layout-template="${runtime.dataAttributes['data-layout-template']}"`);
    expect(html).toContain('data-nav-sticky="true"');
  });
});
