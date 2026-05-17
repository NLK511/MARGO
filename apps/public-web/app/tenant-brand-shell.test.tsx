import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TenantBrandShell } from './tenant-brand-shell';

const branding = {
  slug: 'maison-noire',
  displayName: 'Maison Noire',
  themePresetId: 'luxury-dark-dining',
  enabledModules: ['frontpage'],
  logoUrl: null,
  faviconUrl: null,
};

describe('TenantBrandShell', () => {
  it('defaults the brand link to the tenant home route', () => {
    const html = renderToStaticMarkup(
      <TenantBrandShell branding={branding} homeHref="/">
        <div />
      </TenantBrandShell>,
    );

    expect(html).toContain('href="/t/maison-noire"');
    expect(html).not.toContain('href="/"');
  });

  it('keeps an explicit tenant-safe home link', () => {
    const html = renderToStaticMarkup(
      <TenantBrandShell branding={branding} homeHref="/t/maison-noire/booking">
        <div />
      </TenantBrandShell>,
    );

    expect(html).toContain('href="/t/maison-noire/booking"');
  });
});
