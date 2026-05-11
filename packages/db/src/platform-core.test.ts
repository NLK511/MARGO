import { describe, expect, it, vi } from 'vitest';
import {
  BookingConflictError,
  calculateAvailability,
  createAuditLogService,
  createBookingService,
  createEventOutboxService,
  createPublicPageService,
  createTenantBrandingService,
} from './index';

const uuid = '00000000-0000-4000-a000-000000000001';

function pageFixture(status: 'draft' | 'published' = 'published') {
  return {
    id: uuid,
    tenantId: uuid,
    slug: 'home',
    locale: 'en',
    title: 'Demo homepage',
    seo: { title: 'Demo homepage', description: 'Public page SEO.' },
    status,
    layoutPreset: 'classic',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    blocks: [
      { id: uuid, tenantId: uuid, pageId: uuid, type: 'hero', variant: 'split', props: { headline: 'Hello' }, visibility: null, position: 0, createdAt: new Date(), updatedAt: new Date() },
    ],
    tenant: {
      services: [{ id: uuid, tenantId: uuid, locationId: uuid, slug: 'consult', name: 'Consult', description: 'Intro', verticalType: 'clinic', durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, priceMinor: null, currency: null, requiresPayment: false, depositMinor: null, active: true, createdAt: new Date(), updatedAt: new Date() }],
      locations: [{ id: uuid, tenantId: uuid, name: 'Main', timezone: 'Europe/Paris', address: { city: 'Paris' }, phone: '+331', email: 'hello@example.test', active: true }],
    },
  };
}

describe('public page service', () => {
  it('fetches only published public pages with ordered blocks and tenant data', async () => {
    const findFirst = vi.fn(async () => pageFixture('published'));
    const service = createPublicPageService({ publicPage: { findFirst, findMany: vi.fn(), update: vi.fn() } });

    const page = await service.findPublishedPage({ tenantId: uuid, slug: 'home', locale: 'en' });

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'published' }) }));
    expect(page).toMatchObject({ title: 'Demo homepage', blocks: [{ type: 'hero' }], services: [{ slug: 'consult' }], locations: [{ name: 'Main' }] });
  });

  it('does not return draft pages to the public lookup', async () => {
    const findFirst = vi.fn(async () => null);
    const service = createPublicPageService({ publicPage: { findFirst, findMany: vi.fn(), update: vi.fn() } });

    await expect(service.findPublishedPage({ tenantId: uuid })).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'published' }) }));
  });

  it('returns null for missing public pages', async () => {
    const service = createPublicPageService({ publicPage: { findFirst: vi.fn(async () => null), findMany: vi.fn(), update: vi.fn() } });

    await expect(service.findPublishedPage({ tenantId: uuid, slug: 'missing' })).resolves.toBeNull();
  });

  it('lists admin pages regardless of publication status', async () => {
    const updatedAt = new Date('2026-01-01T00:00:00Z');
    const findMany = vi.fn(async () => [{ id: uuid, slug: 'home', locale: 'en', title: 'Home', status: 'draft', updatedAt }]);
    const service = createPublicPageService({ publicPage: { findFirst: vi.fn(), findMany, update: vi.fn() } });

    await expect(service.listPages({ tenantId: uuid })).resolves.toEqual([{ id: uuid, slug: 'home', locale: 'en', title: 'Home', status: 'draft', updatedAt }]);
  });
});

describe('tenant branding service', () => {
  it('persists tenant theme preset and overrides', () => {
    const upsert = vi.fn((args: unknown) => args);
    const service = createTenantBrandingService({ tenantBranding: { upsert } });

    service.saveTheme({
      tenantId: uuid,
      themePresetId: 'organic-wellness',
      themeOverrides: { colors: { primary: '#111111' } },
      layoutConfig: { nav: 'minimal' },
    });

    expect(upsert).toHaveBeenCalledWith({
      where: { tenantId: uuid },
      update: {
        themePresetId: 'organic-wellness',
        themeOverrides: { colors: { primary: '#111111' } },
        layoutConfig: { nav: 'minimal' },
      },
      create: {
        tenantId: uuid,
        themePresetId: 'organic-wellness',
        themeOverrides: { colors: { primary: '#111111' } },
        layoutConfig: { nav: 'minimal' },
      },
    });
  });
});

describe('booking availability engine', () => {
  it('calculates capacity-aware slots and excludes overlapping bookings', () => {
    const slots = calculateAvailability({
      service: { id: 'dinner', durationMinutes: 60 },
      resources: [
        { id: 'small-table', active: true, capacity: 2 },
        { id: 'large-table', active: true, capacity: 4 },
      ],
      bookings: [{ resourceId: 'large-table', startsAt: new Date('2026-05-11T09:00:00.000Z'), endsAt: new Date('2026-05-11T10:00:00.000Z'), status: 'confirmed' }],
      date: '2026-05-11',
      partySize: 3,
      businessHours: { opensAt: '09:00', closesAt: '11:00' },
      slotMinutes: 30,
    });

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual(['2026-05-11T10:00:00.000Z']);
    expect(slots[0]?.resourceId).toBe('large-table');
  });
});

describe('booking service', () => {
  function createMockBookingClient(overlapping: unknown = null) {
    const bookingCreate = vi.fn(async () => ({ id: uuid, customerId: uuid, publicToken: 'public-token' }));
    const eventCreate = vi.fn();
    const timelineCreate = vi.fn();
    const client = {
      $transaction: vi.fn(async (callback) => callback(client)),
      service: { findFirst: vi.fn(async () => ({ id: uuid, durationMinutes: 45 })) },
      booking: { findFirst: vi.fn(async (args) => (args?.where?.metadata ? null : overlapping)), create: bookingCreate, update: vi.fn(), findMany: vi.fn() },
      customer: { findFirst: vi.fn(async () => null), create: vi.fn(async () => ({ id: uuid })), update: vi.fn() },
      eventOutbox: { create: eventCreate },
      customerTimelineEvent: { create: timelineCreate },
    };
    return { client, bookingCreate, eventCreate, timelineCreate };
  }

  it('creates a booking, customer, outbox event, and CRM timeline event', async () => {
    const { client, bookingCreate, eventCreate, timelineCreate } = createMockBookingClient();
    const service = createBookingService(client);

    await service.createPublicBooking({
      tenantId: uuid,
      enabledModules: ['frontpage', 'booking', 'crm'],
      locationId: uuid,
      serviceId: uuid,
      resourceId: uuid,
      startsAt: new Date('2026-05-11T09:00:00.000Z'),
      customer: { displayName: 'Demo Patient', email: 'patient@example.test' },
      idempotencyKey: 'idem-1',
    });

    expect(bookingCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'confirmed' }) }));
    expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventType: 'booking.created' }) }));
    expect(timelineCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventType: 'booking.created' }) }));
  });

  it('prevents double booking for overlapping resource slots', async () => {
    const { client } = createMockBookingClient({ id: 'overlap' });
    const service = createBookingService(client);

    await expect(
      service.createPublicBooking({
        tenantId: uuid,
        enabledModules: ['frontpage', 'booking'],
        locationId: uuid,
        serviceId: uuid,
        resourceId: uuid,
        startsAt: new Date('2026-05-11T09:00:00.000Z'),
        customer: { displayName: 'Demo Guest', email: 'guest@example.test' },
        idempotencyKey: 'idem-2',
      }),
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it('supports restaurant and clinic smoke booking inputs', async () => {
    const restaurant = createMockBookingClient();
    const clinic = createMockBookingClient();

    await expect(createBookingService(restaurant.client).createPublicBooking({ tenantId: uuid, enabledModules: ['booking'], locationId: uuid, serviceId: uuid, resourceId: uuid, startsAt: new Date('2026-05-11T18:00:00.000Z'), customer: { displayName: 'Restaurant Guest' }, idempotencyKey: 'restaurant' })).resolves.toMatchObject({ publicToken: 'public-token' });
    await expect(createBookingService(clinic.client).createPublicBooking({ tenantId: uuid, enabledModules: ['booking', 'crm'], locationId: uuid, serviceId: uuid, resourceId: uuid, startsAt: new Date('2026-05-11T09:00:00.000Z'), customer: { displayName: 'Clinic Patient' }, idempotencyKey: 'clinic' })).resolves.toMatchObject({ publicToken: 'public-token' });
  });
});

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
