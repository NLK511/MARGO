import { describe, expect, it, vi } from 'vitest';
import { createAuditLogService, createEventOutboxService, createPublicPageService, createTenantBrandingService } from './index';

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
