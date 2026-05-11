import { Prisma, PrismaClient } from '@prisma/client';

export const databasePackageStatus = 'platform-core-ready-milestone-2' as const;

const globalForPrisma = globalThis as unknown as {
  margoPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.margoPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.margoPrisma = prisma;
}

export type { PrismaClient } from '@prisma/client';

export interface DatabaseTenantLookupRecord {
  tenantId: string;
  slug: string;
  displayName?: string;
  enabledModules: string[];
  locale: string;
  timezone: string;
  themePresetId?: string;
  layoutConfig?: Record<string, unknown>;
}

export interface DatabaseTenantResolverRepository {
  findByHostname(hostname: string): Promise<DatabaseTenantLookupRecord | null>;
  findBySlug(slug: string): Promise<DatabaseTenantLookupRecord | null>;
}

export function createPrismaTenantResolverRepository(
  client: Pick<PrismaClient, 'domain' | 'tenant'> = prisma,
): DatabaseTenantResolverRepository {
  return {
    async findByHostname(hostname) {
      const domain = await client.domain.findFirst({
        where: { hostname, status: 'verified' },
        include: { tenant: { include: { modules: true, branding: true } } },
      });
      return domain ? mapTenantLookupRecord(domain.tenant) : null;
    },

    async findBySlug(slug) {
      const tenant = await client.tenant.findUnique({
        where: { slug },
        include: { modules: true, branding: true },
      });
      return tenant ? mapTenantLookupRecord(tenant) : null;
    },
  };
}

type TenantWithResolverRelations = Prisma.TenantGetPayload<{
  include: { modules: true; branding: true };
}>;

function mapTenantLookupRecord(tenant: TenantWithResolverRelations): DatabaseTenantLookupRecord {
  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    displayName: tenant.displayName,
    enabledModules: tenant.modules
      .filter((module) => module.enabled)
      .map((module) => module.moduleId)
      .sort(),
    locale: tenant.primaryLocale,
    timezone: tenant.timezone,
    themePresetId: tenant.branding?.themePresetId,
    layoutConfig: isPlainObject(tenant.branding?.layoutConfig) ? tenant.branding.layoutConfig : undefined,
  };
}

function isPlainObject(value: Prisma.JsonValue | undefined): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export interface DomainEventInput<TPayload extends Prisma.InputJsonValue = Prisma.InputJsonValue> {
  tenantId?: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  nextAttemptAt?: Date;
}

export interface AuditLogInput<TMetadata extends Prisma.InputJsonValue = Prisma.InputJsonObject> {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: TMetadata;
  ipAddress?: string | null;
  userAgent?: string | null;
}

type EventOutboxClient = {
  eventOutbox: {
    create(args: { data: Prisma.EventOutboxUncheckedCreateInput }): unknown;
  };
};

type AuditLogClient = {
  auditLog: {
    create(args: { data: Prisma.AuditLogUncheckedCreateInput }): unknown;
  };
};

type TenantBrandingClient = {
  tenantBranding: {
    upsert(args: {
      where: { tenantId: string };
      update: Prisma.TenantBrandingUncheckedUpdateInput;
      create: Prisma.TenantBrandingUncheckedCreateInput;
    }): unknown;
  };
};

type PublicPageClient = {
  publicPage: {
    findFirst(args: unknown): Promise<PublicPageWithRelations | null>;
    findMany(args: unknown): Promise<PublicPageListItem[]>;
    update(args: unknown): Promise<unknown>;
  };
};

export interface PublicPageBlockRecord {
  id: string;
  type: string;
  variant: string;
  props: Prisma.JsonValue;
  position: number;
}

export interface PublicPageServiceRecord {
  slug: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceMinor?: number | null;
  currency?: string | null;
}

export interface PublicPageLocationRecord {
  name: string;
  address?: Prisma.JsonValue;
  phone?: string | null;
  email?: string | null;
}

export interface PublicPageRecord {
  id: string;
  tenantId: string;
  slug: string;
  locale: string;
  title: string;
  seo: Prisma.JsonValue;
  status: string;
  layoutPreset: string;
  blocks: PublicPageBlockRecord[];
  services: PublicPageServiceRecord[];
  locations: PublicPageLocationRecord[];
}

export interface PublicPageListItem {
  id: string;
  slug: string;
  locale: string;
  title: string;
  status: string;
  updatedAt: Date;
}

interface PublicPageWithRelations {
  id: string;
  tenantId: string;
  slug: string;
  locale: string;
  title: string;
  seo: Prisma.JsonValue;
  status: string;
  layoutPreset: string;
  blocks: Array<{ id: string; type: string; variant: string; props: Prisma.JsonValue; position: number }>;
  tenant: {
    services: Array<{
      slug: string;
      name: string;
      description?: string | null;
      durationMinutes: number;
      priceMinor?: number | null;
      currency?: string | null;
    }>;
    locations: Array<{ name: string; address?: Prisma.JsonValue; phone?: string | null; email?: string | null }>;
  };
}

export interface TenantThemePersistenceInput {
  tenantId: string;
  themePresetId: string;
  themeOverrides?: Prisma.InputJsonObject;
  layoutConfig?: Prisma.InputJsonObject;
}

export function createPublicPageService(client: PublicPageClient = prisma as unknown as PublicPageClient) {
  return {
    async findPublishedPage(input: { tenantId: string; slug?: string; locale?: string }): Promise<PublicPageRecord | null> {
      const page = await client.publicPage.findFirst({
        where: {
          tenantId: input.tenantId,
          slug: input.slug ?? 'home',
          locale: input.locale ?? 'en',
          status: 'published',
        },
        include: {
          blocks: { orderBy: { position: 'asc' } },
          tenant: { include: { services: { where: { active: true } }, locations: { where: { active: true } } } },
        },
      });

      return page ? mapPublicPageRecord(page) : null;
    },

    async findPageForAdmin(input: { tenantId: string; pageId: string }): Promise<PublicPageRecord | null> {
      const page = await client.publicPage.findFirst({
        where: { tenantId: input.tenantId, id: input.pageId },
        include: {
          blocks: { orderBy: { position: 'asc' } },
          tenant: { include: { services: { where: { active: true } }, locations: { where: { active: true } } } },
        },
      });

      return page ? mapPublicPageRecord(page) : null;
    },

    listPages(input: { tenantId: string; locale?: string }): Promise<PublicPageListItem[]> {
      return client.publicPage.findMany({
        where: { tenantId: input.tenantId, ...(input.locale ? { locale: input.locale } : {}) },
        select: { id: true, slug: true, locale: true, title: true, status: true, updatedAt: true },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      });
    },

    publishPage(input: { tenantId: string; pageId: string }) {
      return client.publicPage.update({
        where: { id: input.pageId, tenantId: input.tenantId },
        data: { status: 'published' },
      });
    },
  };
}

function mapPublicPageRecord(page: PublicPageWithRelations): PublicPageRecord {
  return {
    id: page.id,
    tenantId: page.tenantId,
    slug: page.slug,
    locale: page.locale,
    title: page.title,
    seo: page.seo,
    status: page.status,
    layoutPreset: page.layoutPreset,
    blocks: page.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      variant: block.variant,
      props: block.props,
      position: block.position,
    })),
    services: page.tenant.services.map((service) => ({
      slug: service.slug,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      priceMinor: service.priceMinor,
      currency: service.currency,
    })),
    locations: page.tenant.locations.map((location) => ({
      name: location.name,
      address: location.address,
      phone: location.phone,
      email: location.email,
    })),
  };
}

export function createTenantBrandingService(client: TenantBrandingClient = prisma) {
  return {
    saveTheme(input: TenantThemePersistenceInput) {
      return client.tenantBranding.upsert({
        where: { tenantId: input.tenantId },
        update: {
          themePresetId: input.themePresetId,
          themeOverrides: input.themeOverrides ?? {},
          layoutConfig: input.layoutConfig ?? {},
        },
        create: {
          tenantId: input.tenantId,
          themePresetId: input.themePresetId,
          themeOverrides: input.themeOverrides ?? {},
          layoutConfig: input.layoutConfig ?? {},
        },
      });
    },
  };
}

export interface AvailabilityServiceInput {
  service: { id: string; durationMinutes: number; bufferBeforeMinutes?: number; bufferAfterMinutes?: number; locationId?: string | null };
  resources: Array<{ id: string; capacity?: number | null; active: boolean; locationId?: string | null }>;
  bookings: Array<{ resourceId?: string | null; startsAt: Date; endsAt: Date; status: string }>;
  date: string;
  partySize?: number;
  businessHours?: { opensAt: string; closesAt: string };
  slotMinutes?: number;
}

export interface AvailabilitySlot {
  startsAt: Date;
  endsAt: Date;
  resourceId: string;
}

const blockingBookingStatuses = new Set(['pending', 'confirmed', 'checked_in']);

export function calculateAvailability(input: AvailabilityServiceInput): AvailabilitySlot[] {
  const slotMinutes = input.slotMinutes ?? 30;
  const hours = input.businessHours ?? { opensAt: '09:00', closesAt: '17:00' };
  const activeResources = input.resources.filter((resource) => {
    if (!resource.active) return false;
    if (input.service.locationId && resource.locationId && resource.locationId !== input.service.locationId) return false;
    if (input.partySize && resource.capacity && resource.capacity < input.partySize) return false;
    return true;
  });

  const [openHour, openMinute] = hours.opensAt.split(':').map(Number);
  const [closeHour, closeMinute] = hours.closesAt.split(':').map(Number);
  const dayStart = new Date(`${input.date}T00:00:00.000Z`);
  const cursor = new Date(dayStart);
  cursor.setUTCHours(openHour ?? 9, openMinute ?? 0, 0, 0);
  const closesAt = new Date(dayStart);
  closesAt.setUTCHours(closeHour ?? 17, closeMinute ?? 0, 0, 0);

  const duration = input.service.durationMinutes + (input.service.bufferBeforeMinutes ?? 0) + (input.service.bufferAfterMinutes ?? 0);
  const slots: AvailabilitySlot[] = [];

  while (cursor.getTime() + duration * 60_000 <= closesAt.getTime()) {
    const startsAt = new Date(cursor);
    const endsAt = new Date(cursor.getTime() + input.service.durationMinutes * 60_000);

    for (const resource of activeResources) {
      const blocked = input.bookings.some(
        (booking) =>
          booking.resourceId === resource.id &&
          blockingBookingStatuses.has(booking.status) &&
          rangesOverlap(startsAt, endsAt, booking.startsAt, booking.endsAt),
      );
      if (!blocked) {
        slots.push({ startsAt, endsAt, resourceId: resource.id });
      }
    }

    cursor.setUTCMinutes(cursor.getUTCMinutes() + slotMinutes);
  }

  return slots;
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export interface PublicBookingInput {
  tenantId: string;
  enabledModules: string[];
  locationId: string;
  serviceId: string;
  resourceId: string;
  startsAt: Date;
  customer: { firstName?: string; lastName?: string; displayName: string; email?: string; phone?: string };
  notes?: string;
  idempotencyKey: string;
}

export class BookingConflictError extends Error {
  constructor() {
    super('Selected booking slot is no longer available.');
    this.name = 'BookingConflictError';
  }
}

type BookingPersistenceClient = {
  $transaction<T>(callback: (transaction: BookingPersistenceClient) => Promise<T>): Promise<T>;
  service: { findFirst(args: unknown): Promise<{ id: string; durationMinutes: number } | null> };
  booking: {
    findFirst(args: unknown): Promise<unknown | null>;
    create(args: unknown): Promise<{ id: string; customerId: string; publicToken: string }>;
    update(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<unknown[]>;
  };
  customer: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
    update(args: unknown): Promise<{ id: string }>;
  };
  eventOutbox: { create(args: { data: Prisma.EventOutboxUncheckedCreateInput }): unknown };
  customerTimelineEvent: { create(args: unknown): unknown };
};

type BookingAdminClient = {
  service: { findMany(args: unknown): Promise<unknown[]>; create(args: unknown): Promise<unknown>; update(args: unknown): Promise<unknown> };
  resource: { findMany(args: unknown): Promise<unknown[]>; create(args: unknown): Promise<unknown>; update(args: unknown): Promise<unknown> };
  booking: { findMany(args: unknown): Promise<unknown[]> };
};

export function createBookingAdminService(client: BookingAdminClient = prisma as unknown as BookingAdminClient) {
  return {
    listServices(input: { tenantId: string }) {
      return client.service.findMany({ where: { tenantId: input.tenantId }, orderBy: { name: 'asc' } });
    },
    createService(input: { tenantId: string; locationId?: string; slug: string; name: string; durationMinutes: number }) {
      return client.service.create({ data: { ...input, active: true } });
    },
    updateService(input: { tenantId: string; serviceId: string; data: { name?: string; durationMinutes?: number; active?: boolean } }) {
      return client.service.update({ where: { id: input.serviceId, tenantId: input.tenantId }, data: input.data });
    },
    listResources(input: { tenantId: string }) {
      return client.resource.findMany({ where: { tenantId: input.tenantId }, orderBy: { name: 'asc' } });
    },
    createResource(input: { tenantId: string; locationId?: string; resourceType: string; name: string; capacity?: number }) {
      return client.resource.create({ data: { ...input, active: true } });
    },
    updateResource(input: { tenantId: string; resourceId: string; data: { name?: string; capacity?: number; active?: boolean } }) {
      return client.resource.update({ where: { id: input.resourceId, tenantId: input.tenantId }, data: input.data });
    },
    listBookings(input: { tenantId: string; from?: Date; to?: Date }) {
      return client.booking.findMany({
        where: { tenantId: input.tenantId, ...(input.from && input.to ? { startsAt: { gte: input.from, lt: input.to } } : {}) },
        orderBy: { startsAt: 'asc' },
      });
    },
  };
}

export function createBookingService(client: BookingPersistenceClient = prisma as unknown as BookingPersistenceClient) {
  return {
    async createPublicBooking(input: PublicBookingInput) {
      return client.$transaction(async (transaction) => {
        const idempotentBooking = await transaction.booking.findFirst({
          where: { tenantId: input.tenantId, metadata: { path: ['idempotencyKey'], equals: input.idempotencyKey } },
        });
        if (idempotentBooking) return idempotentBooking;

        const service = await transaction.service.findFirst({ where: { id: input.serviceId, tenantId: input.tenantId, active: true } });
        if (!service) throw new Error('Service not found.');

        const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);
        const overlapping = await transaction.booking.findFirst({
          where: {
            tenantId: input.tenantId,
            resourceId: input.resourceId,
            status: { in: Array.from(blockingBookingStatuses) },
            startsAt: { lt: endsAt },
            endsAt: { gt: input.startsAt },
          },
        });
        if (overlapping) throw new BookingConflictError();

        const customer = await upsertBookingCustomer(transaction, input);
        const publicToken = createPublicBookingToken(input.tenantId, input.idempotencyKey, input.startsAt);
        const booking = await transaction.booking.create({
          data: {
            tenantId: input.tenantId,
            locationId: input.locationId,
            serviceId: input.serviceId,
            resourceId: input.resourceId,
            customerId: customer.id,
            startsAt: input.startsAt,
            endsAt,
            status: 'confirmed',
            source: 'public_web',
            publicToken,
            notes: input.notes,
            metadata: { idempotencyKey: input.idempotencyKey },
          },
        });

        await transaction.eventOutbox.create({
          data: {
            tenantId: input.tenantId,
            eventType: 'booking.created',
            aggregateType: 'booking',
            aggregateId: booking.id,
            payload: { bookingId: booking.id, customerId: customer.id, startsAt: input.startsAt.toISOString(), endsAt: endsAt.toISOString() },
          },
        });

        if (input.enabledModules.includes('crm')) {
          await transaction.customerTimelineEvent.create({
            data: {
              tenantId: input.tenantId,
              customerId: customer.id,
              eventType: 'booking.created',
              aggregateType: 'booking',
              aggregateId: booking.id,
              payload: { publicToken: booking.publicToken, startsAt: input.startsAt.toISOString() },
            },
          });
        }

        return booking;
      });
    },

    async cancelByPublicToken(input: { tenantId: string; publicToken: string }) {
      return client.booking.update({ where: { publicToken: input.publicToken, tenantId: input.tenantId }, data: { status: 'cancelled' } });
    },

    async updateStaffStatus(input: { tenantId: string; bookingId: string; status: 'cancelled' | 'checked_in' | 'no_show' }) {
      return client.booking.update({ where: { id: input.bookingId, tenantId: input.tenantId }, data: { status: input.status } });
    },
  };
}

async function upsertBookingCustomer(transaction: BookingPersistenceClient, input: PublicBookingInput): Promise<{ id: string }> {
  const existing = input.customer.email
    ? await transaction.customer.findFirst({ where: { tenantId: input.tenantId, email: input.customer.email } })
    : null;

  const data = {
    profileKind: input.enabledModules.includes('crm') ? 'patient' : 'customer',
    firstName: input.customer.firstName,
    lastName: input.customer.lastName,
    displayName: input.customer.displayName,
    email: input.customer.email,
    phone: input.customer.phone,
  };

  if (existing) {
    return transaction.customer.update({ where: { id: existing.id }, data });
  }

  return transaction.customer.create({ data: { tenantId: input.tenantId, ...data } });
}

function createPublicBookingToken(tenantId: string, idempotencyKey: string, startsAt: Date): string {
  return Buffer.from(`${tenantId}:${idempotencyKey}:${startsAt.toISOString()}`).toString('base64url').slice(0, 40);
}

export function createEventOutboxService(client: EventOutboxClient = prisma) {
  return {
    enqueue<TPayload extends Prisma.InputJsonValue>(event: DomainEventInput<TPayload>) {
      return client.eventOutbox.create({
        data: {
          tenantId: event.tenantId,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          nextAttemptAt: event.nextAttemptAt,
        },
      });
    },

    enqueueNotificationRequested(input: {
      tenantId: string;
      aggregateId: string;
      channel: 'email' | 'sms' | 'push';
      templateId: string;
      recipientId: string;
      data: Prisma.InputJsonObject;
    }) {
      return this.enqueue({
        tenantId: input.tenantId,
        eventType: 'notification.requested',
        aggregateType: 'notification',
        aggregateId: input.aggregateId,
        payload: {
          channel: input.channel,
          templateId: input.templateId,
          recipientId: input.recipientId,
          data: input.data,
        },
      });
    },
  };
}

export function createAuditLogService(client: AuditLogClient = prisma) {
  return {
    record<TMetadata extends Prisma.InputJsonValue = Prisma.InputJsonObject>(entry: AuditLogInput<TMetadata>) {
      return client.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorUserId: entry.actorUserId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata ?? {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    },
  };
}
