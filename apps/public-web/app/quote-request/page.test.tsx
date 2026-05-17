import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicQuoteRequestPage from './page';

vi.mock('./quote-request-data', () => ({
  getQuoteRequestPageForCurrentRequest: vi.fn(async () => ({
    tenant: {
      slug: 'maison-noire',
      displayName: 'Maison Noire',
      themePresetId: 'luxury-dark-dining',
      enabledModules: ['quote-request'],
    },
    config: {},
  })),
}));

vi.mock('./quote-request-wizard', () => ({
  QuoteRequestWizard: () => <div data-testid="wizard" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PublicQuoteRequestPage', () => {
  it('links the brand back to the tenant page instead of the public home page', async () => {
    const element = await PublicQuoteRequestPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain('href="/t/maison-noire"');
    expect(html).not.toContain('href="/"');
  });
});
