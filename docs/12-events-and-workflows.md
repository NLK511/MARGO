## Event Envelope

```ts
interface DomainEvent<TPayload> {
  id: string;
  tenantId: string;
  type: string;
  version: number;
  occurredAt: string;
  aggregate: {
    type: string;
    id: string;
  };
  actor?: {
    type: 'user' | 'customer' | 'system';
    id?: string;
  };
  payload: TPayload;
}
```

## Core Events

```yaml
events:
  booking.created:
    version: 1
    payload:
      bookingId: string
      customerId: string
      startsAt: string
      endsAt: string
      serviceId: string
      resourceId: string|null

  booking.cancelled:
    version: 1
    payload:
      bookingId: string
      cancelledBy: customer|staff|system
      reason: string|null

  booking.rescheduled:
    version: 1
    payload:
      bookingId: string
      oldStartsAt: string
      newStartsAt: string

  customer.created:
    version: 1
    payload:
      customerId: string
      source: string

  notification.requested:
    version: 1
    payload:
      channel: email|sms|push
      templateId: string
      recipientId: string
      data: object
```

## Required Workflows

### Booking Created

1. Create booking transactionally.
2. Insert timeline event if CRM enabled.
3. Insert `booking.created` outbox event.
4. Worker consumes `notification.requested` outbox events and sends mail through the configured provider adapter.
5. Worker schedules reminder notification.
6. Worker syncs calendar if enabled.

### Booking Cancelled

1. Update booking status.
2. Release slot.
3. Insert timeline event.
4. Queue cancellation notification.
5. Sync calendar deletion/update.
6. Process refund if policy requires.

### Payment Succeeded

1. Verify webhook signature.
2. Deduplicate event.
3. Attach payment to booking.
4. Confirm pending booking if needed.
5. Queue receipt notification.

---

