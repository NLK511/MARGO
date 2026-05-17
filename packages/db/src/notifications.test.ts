import { describe, expect, it, vi } from 'vitest';
import { createEmailDeliveryService, createNotificationOutboxWorker } from './index';

describe('email delivery service', () => {
  it('uses the log adapter by default', async () => {
    const info = vi.fn();
    const service = createEmailDeliveryService({ logger: { info, warn: vi.fn(), error: vi.fn() } });

    await service.send({ to: 'team@example.test', subject: 'Hello', text: 'Body' });

    expect(info).toHaveBeenCalledWith(expect.stringContaining('[email:log] to=team@example.test subject=Hello'));
  });

  it('sends resend email requests', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    const service = createEmailDeliveryService({ provider: 'resend', apiKey: 'test-key', from: 'MARGO <noreply@example.test>', fetchImpl });

    await service.send({ to: 'team@example.test', subject: 'Hello', text: 'Body', replyTo: 'lead@example.test' });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });
});

describe('notification outbox worker', () => {
  it('processes pending notification events through the mailer', async () => {
    const update = vi.fn(async (args) => args);
    const mailer = { provider: 'log', send: vi.fn(async () => undefined) };
    const worker = createNotificationOutboxWorker(
      {
        eventOutbox: {
          findMany: vi.fn(async () => [
            {
              id: 'event-1',
              attempts: 0,
              payload: {
                recipientId: 'team@example.test',
                templateId: 'quote-request-tenant',
                data: { subject: 'New quote', body: 'Quote body', replyTo: 'lead@example.test' },
              },
            },
          ]),
          update,
        },
      },
      { mailer: mailer as never, take: 10 },
    );

    const result = await worker.processPending();

    expect(mailer.send).toHaveBeenCalledWith({
      to: 'team@example.test',
      subject: 'New quote',
      text: 'Quote body',
      replyTo: 'lead@example.test',
      from: undefined,
    });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'event-1' }, data: expect.objectContaining({ status: 'processed' }) }));
    expect(result).toEqual({ processed: 1, failed: 0, attempted: 1 });
  });
});
