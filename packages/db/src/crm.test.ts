import { describe, expect, it, vi } from 'vitest';
import { createCrmService, getCrmLabels } from './index';

const tenantId = '00000000-0000-0000-0000-000000000001';
const customerId = '00000000-0000-0000-0000-000000000002';
const authorUserId = '00000000-0000-0000-0000-000000000003';

type MockCrmClient = NonNullable<Parameters<typeof createCrmService>[0]>;

function createCrmClient(overrides: Partial<MockCrmClient> = {}): MockCrmClient {
  return {
    customer: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    customerNote: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({ id: 'note-1', body: 'Needs a quiet room.', visibility: 'internal', createdAt: new Date('2026-05-11T10:00:00.000Z'), author: { displayName: 'Front Desk' } })),
    },
    customerTimelineEvent: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({})),
    },
    customFieldDefinition: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({})),
    },
    ...overrides,
  } as MockCrmClient;
}

describe('crm service', () => {
  it('searches tenant customers by name, email, or phone', async () => {
    const client = createCrmClient({
      customer: {
        findMany: vi.fn(async () => [
          { id: customerId, displayName: 'Demo Patient', email: 'patient@example.test', phone: '+33123456789', profileKind: 'patient', updatedAt: new Date('2026-05-11T09:00:00.000Z') },
        ]),
        findFirst: vi.fn(async () => null),
      },
    });

    const results = await createCrmService(client).searchCustomers({ tenantId, query: 'patient' });

    expect(results).toHaveLength(1);
    expect(results[0]?.displayName).toBe('Demo Patient');
    expect(client.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId, OR: expect.any(Array) }),
      take: 25,
    }));
  });

  it('returns a profile with notes, authors, custom fields, and booking timeline events', async () => {
    const client = createCrmClient({
      customer: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => ({ id: customerId, displayName: 'Demo Patient', firstName: 'Demo', lastName: 'Patient', email: 'patient@example.test', phone: '+33123456789', profileKind: 'patient', updatedAt: new Date('2026-05-11T09:00:00.000Z') })),
      },
      customerNote: {
        findMany: vi.fn(async () => [{ id: 'note-1', body: 'Needs a quiet room.', visibility: 'internal', createdAt: new Date('2026-05-11T10:00:00.000Z'), author: { displayName: 'Front Desk' } }]),
        create: vi.fn(async () => ({ id: 'note-1', body: 'Needs a quiet room.', visibility: 'internal', createdAt: new Date('2026-05-11T10:00:00.000Z'), author: { displayName: 'Front Desk' } })),
      },
      customerTimelineEvent: {
        findMany: vi.fn(async () => [{ id: 'event-1', eventType: 'booking.created', payload: { startsAt: '2026-05-11T11:00:00.000Z' }, occurredAt: new Date('2026-05-11T09:30:00.000Z') }]),
        create: vi.fn(async () => ({})),
      },
      customFieldDefinition: {
        findMany: vi.fn(async () => [{ id: 'field-1', key: 'allergies', label: 'Allergies', fieldType: 'text', required: false }]),
        create: vi.fn(async () => ({})),
      },
    });

    const profile = await createCrmService(client).getCustomerProfile({ tenantId, customerId });

    expect(profile?.notes[0]).toMatchObject({ body: 'Needs a quiet room.', authorName: 'Front Desk' });
    expect(profile?.customFields[0]?.key).toBe('allergies');
    expect(profile?.timeline.map((item) => item.title)).toEqual(['Note added', 'Appointment booked']);
  });

  it('adds a note and records one timeline event for the note', async () => {
    const client = createCrmClient();

    await createCrmService(client).addCustomerNote({ tenantId, customerId, authorUserId, body: 'Call before appointment.' });

    expect(client.customerNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId, customerId, authorUserId, body: 'Call before appointment.', visibility: 'internal' }),
    });
    expect(client.customerTimelineEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        customerId,
        eventType: 'customer.note.created',
        aggregateType: 'customer_note',
        aggregateId: 'note-1',
      }),
    });
  });

  it('uses clinic patient labels', () => {
    expect(getCrmLabels({ verticalType: 'clinic' })).toEqual({
      singular: 'Patient',
      plural: 'Patients',
      bookingSingular: 'Appointment',
      bookingPlural: 'Appointments',
    });
  });
});
