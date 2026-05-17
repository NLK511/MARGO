import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { QuoteRequestRecord } from '@margo/db';
import { QuoteRequestConfirmation } from './quote-request-confirmation';

const request = {
  id: 'request-1',
  publicToken: 'token-1',
  tenantId: 'tenant-1',
  customerId: null,
  status: 'submitted',
  outputMode: 'quote',
  recipientEmail: 'team@example.test',
  requesterName: 'Ada Lovelace',
  requesterEmail: 'ada@example.test',
  requesterPhone: '+33 1 23 45 67 89',
  requesterCompany: 'Analytical Engines Ltd',
  answers: { service: 'Dinner service', guests: 12, notes: 'Window table' },
  quoteBreakdown: [
    { label: 'Base package', kind: 'base', amountMinor: 12000 },
    { label: 'Guests: 12', kind: 'option', amountMinor: 6000, note: 'Per guest surcharge' },
  ],
  quoteMinor: 18000,
  currency: 'EUR',
  configSnapshot: {
    successTitle: 'Thanks — we got it',
    successBody: 'We will review your request shortly.',
    estimatedLabel: 'Estimated total',
    questions: [
      { id: 'service', label: 'Service type' },
      { id: 'guests', label: 'Guests' },
      { id: 'notes', label: 'Notes' },
    ],
  },
  submittedAt: new Date('2026-05-11T10:00:00.000Z'),
} as unknown as QuoteRequestRecord;

describe('QuoteRequestConfirmation', () => {
  it('renders a formatted summary instead of raw JSON', () => {
    const html = renderToStaticMarkup(<QuoteRequestConfirmation request={request} />);

    expect(html).toContain('Thanks — we got it');
    expect(html).toContain('Request summary');
    expect(html).toContain('Service type');
    expect(html).toContain('Dinner service');
    expect(html).toContain('Guests');
    expect(html).toContain('12');
    expect(html).toContain('Estimated total');
    expect(html).toContain('€180.00');
    expect(html).toContain('Base package');
    expect(html).not.toContain('"answers"');
    expect(html).not.toContain('<pre>');
  });
});
