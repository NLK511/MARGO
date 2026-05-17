import { describe, expect, it, vi } from 'vitest';
import { createQuoteRequestService, type QuoteRequestModuleConfig } from './index';

const tenantId = '00000000-0000-0000-0000-000000000010';
const customerId = '00000000-0000-0000-0000-000000000011';

function createClient(overrides: Partial<NonNullable<Parameters<typeof createQuoteRequestService>[0]>> = {}) {
  return {
    tenantModule: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async (value) => value),
    },
    quoteRequest: {
      create: vi.fn(async (args) => ({
        id: '00000000-0000-0000-0000-000000000012',
        publicToken: 'public-token',
        tenantId,
        customerId,
        status: 'submitted',
        outputMode: 'quote' as const,
        recipientEmail: 'team@example.test',
        requesterName: 'Demo Lead',
        requesterEmail: 'lead@example.test',
        requesterPhone: null,
        requesterCompany: null,
        answers: {},
        quoteBreakdown: [],
        quoteMinor: 12000,
        currency: 'EUR',
        configSnapshot: args?.data?.configSnapshot ?? {},
        submittedAt: new Date('2026-05-11T10:00:00.000Z'),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    customer: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: customerId })),
      update: vi.fn(async () => ({ id: customerId })),
    },
    customerTimelineEvent: { create: vi.fn(async () => ({})) },
    eventOutbox: { create: vi.fn(async () => ({})) },
    ...overrides,
  } as NonNullable<Parameters<typeof createQuoteRequestService>[0]>;
}

describe('quote request service', () => {
  it('returns default config when no tenant config exists', async () => {
    const service = createQuoteRequestService(createClient());
    const config = await service.getConfig({ tenantId });

    expect(config.title).toBe('Request a quote');
    expect(config.questions).toHaveLength(3);
  });

  it('creates a quote request, lead customer, and notification events', async () => {
    const client = createClient({
      tenantModule: {
        findUnique: vi.fn(async () => ({ config: { title: 'Private quote', outputMode: 'quote', currency: 'EUR', questions: [{ id: 'service', label: 'Service', type: 'select', options: [{ label: 'Dinner', value: 'dinner', priceMinor: 1000 }] }], leadFields: [{ key: 'displayName', label: 'Name', type: 'text', required: true }], recipientEmail: 'team@example.test' }, enabled: true })),
        upsert: vi.fn(async (value) => value),
      },
      quoteRequest: {
        create: vi.fn(async () => ({
          id: '00000000-0000-0000-0000-000000000012',
          publicToken: 'public-token',
          tenantId,
          customerId,
          status: 'submitted',
          outputMode: 'quote' as const,
          recipientEmail: 'team@example.test',
          requesterName: 'Demo Lead',
          requesterEmail: 'lead@example.test',
          requesterPhone: null,
          requesterCompany: null,
          answers: { service: 'dinner' },
          quoteBreakdown: [{ label: 'Service: Dinner', kind: 'option', amountMinor: 1000 }],
          quoteMinor: 1000,
          currency: 'EUR',
          configSnapshot: {},
          submittedAt: new Date('2026-05-11T10:00:00.000Z'),
        })),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
    });

    const service = createQuoteRequestService(client);
    const result = await service.submit({
      tenantId,
      enabledModules: ['quote-request', 'notifications', 'crm'],
      config: {
        title: 'Private quote',
        outputMode: 'quote',
        currency: 'EUR',
        questions: [{ id: 'service', label: 'Service', type: 'select', options: [{ label: 'Dinner', value: 'dinner', priceMinor: 1000 }] }],
        leadFields: [{ key: 'displayName', label: 'Name', type: 'text', required: true }],
        recipientEmail: 'team@example.test',
      } as QuoteRequestModuleConfig,
      answers: { service: 'dinner' },
      lead: { displayName: 'Demo Lead', email: 'lead@example.test' },
    });

    expect(result.quoteRequest.publicToken).toBe('public-token');
    expect(client.customer?.create).toHaveBeenCalled();
    const eventCreate = client.eventOutbox?.create as unknown as { mock: { calls: Array<[{ data: { eventType: string } }]> } };
    expect(eventCreate.mock.calls).toHaveLength(3);
    expect(result.estimate.totalMinor).toBe(1000);
    expect(eventCreate.mock.calls.map(([call]) => call.data.eventType)).toEqual([
      'quote.requested',
      'notification.requested',
      'notification.requested',
    ]);
    expect(client.eventOutbox?.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'notification.requested',
          payload: expect.objectContaining({
            channel: 'email',
            templateId: 'quote-request-tenant',
            data: expect.objectContaining({ subject: 'Private quote — new quote request' }),
          }),
        }),
      }),
    );
  });
});
