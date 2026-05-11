import { describe, expect, it, vi } from 'vitest';
import { createAuditLogService, createEventOutboxService } from './index';

const uuid = '00000000-0000-4000-a000-000000000001';

describe('event outbox service', () => {
  it('creates durable pending domain events', () => {
    const create = vi.fn((args: unknown) => args);
    const service = createEventOutboxService({ eventOutbox: { create } });

    service.enqueue({
      tenantId: uuid,
      eventType: 'booking.created',
      aggregateType: 'booking',
      aggregateId: uuid,
      payload: { bookingId: uuid },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: uuid,
        eventType: 'booking.created',
        aggregateType: 'booking',
        aggregateId: uuid,
        payload: { bookingId: uuid },
        nextAttemptAt: undefined,
      },
    });
  });

  it('normalizes notification requested events', () => {
    const create = vi.fn((args: unknown) => args);
    const service = createEventOutboxService({ eventOutbox: { create } });

    service.enqueueNotificationRequested({
      tenantId: uuid,
      aggregateId: uuid,
      channel: 'email',
      templateId: 'booking-confirmation',
      recipientId: uuid,
      data: { locale: 'en' },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: 'notification.requested', aggregateType: 'notification' }),
      }),
    );
  });
});

describe('audit log service', () => {
  it('records sensitive admin actions with tenant and actor context', () => {
    const create = vi.fn((args: unknown) => args);
    const service = createAuditLogService({ auditLog: { create } });

    service.record({
      tenantId: uuid,
      actorUserId: uuid,
      action: 'tenant.modules.disable',
      entityType: 'tenant_module',
      entityId: uuid,
      metadata: { moduleId: 'booking' },
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        tenantId: uuid,
        actorUserId: uuid,
        action: 'tenant.modules.disable',
        entityType: 'tenant_module',
        entityId: uuid,
        metadata: { moduleId: 'booking' },
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
      },
    });
  });
});
