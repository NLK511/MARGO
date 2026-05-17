import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QuoteRequestWizard } from './quote-request-wizard';
import type { QuoteRequestModuleConfig } from '@margo/db';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const config: QuoteRequestModuleConfig = {
  title: 'Request a private dinner quote',
  intro: 'Tell us what you need.',
  outputMode: 'quote',
  currency: 'EUR',
  basePriceMinor: 0,
  estimatedLabel: 'Estimate',
  successTitle: 'Done',
  successBody: 'Thanks',
  wizardStyle: 'split',
  stepTransition: 'zoom',
  leadFields: [{ key: 'displayName', label: 'Name', type: 'text', required: true }, { key: 'email', label: 'Email', type: 'email', required: true }],
  questions: [{ id: 'guests', label: 'Guests', type: 'number', required: true }],
};

describe('QuoteRequestWizard animations', () => {
  it('renders selected wizard style and transition attributes for runtime CSS animations', () => {
    const html = renderToStaticMarkup(<QuoteRequestWizard tenantSlug="maison-noire" confirmationBasePath="/t/maison-noire/quote-request/confirmation" config={config} />);

    expect(html).toContain('quote-request-style-split');
    expect(html).toContain('data-step-transition="zoom"');
    expect(html).toContain('data-step-direction="forward"');
    expect(html).toContain('quote-request-stage-panel-in quote-request-stage-zoom');
  });
});
