import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL = 'postgresql://margo:margo@localhost:5432/margo?schema=public';
loadRepoEnvFile();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

export const databasePackageStatus = 'platform-core-ready-milestone-2' as const;

export function loadRepoEnvFile(envPath: string = resolveRepoDotEnvPath()): void {
  if (!existsSync(envPath)) return;
  applyEnvEntries(parseDotEnvContent(readFileSync(envPath, 'utf8')));
}

export function applyEnvEntries(entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function parseDotEnvContent(content: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const key = match[1]!;
    const rawValue = match[2]!;
    entries[key] = parseDotEnvValue(rawValue);
  }

  return entries;
}

function resolveRepoDotEnvPath(startDir = process.cwd()): string {
  let current = startDir;
  while (true) {
    const candidate = resolve(current, '.env');
    if (existsSync(candidate)) return candidate;

    const parent = dirname(current);
    if (parent === current) return candidate;
    current = parent;
  }
}

function parseDotEnvValue(rawValue: string): string {
  const value = rawValue.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  const commentIndex = value.search(/\s+#/);
  return (commentIndex >= 0 ? value.slice(0, commentIndex) : value).trim();
}

const globalForPrisma = globalThis as unknown as {
  margoPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.margoPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.margoPrisma = prisma;
}

export type { PrismaClient } from '@prisma/client';
export * from './demo-seed-state';

export interface DatabaseTenantLookupRecord {
  tenantId: string;
  slug: string;
  displayName?: string;
  enabledModules: string[];
  locale: string;
  timezone: string;
  themePresetId?: string;
  layoutConfig?: Record<string, unknown>;
  themeOverrides?: Record<string, unknown>;
  logoUrl?: string | null;
  faviconUrl?: string | null;
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
    themeOverrides: isPlainObject(tenant.branding?.themeOverrides) ? tenant.branding.themeOverrides : undefined,
    logoUrl: tenant.branding?.logoUrl,
    faviconUrl: tenant.branding?.faviconUrl,
  };
}

function isPlainObject(value: unknown): value is Prisma.JsonObject {
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
      const sharedInclude = {
        blocks: { orderBy: { position: 'asc' } },
        tenant: { include: { services: { where: { active: true } }, locations: { where: { active: true } } } },
      } as const;
      const slug = input.slug ?? 'home';
      const locale = input.locale ?? 'en';

      const page = await client.publicPage.findFirst({
        where: { tenantId: input.tenantId, slug, locale, status: 'published' },
        include: sharedInclude,
      });

      if (page) return mapPublicPageRecord(page);

      const fallbackPage = await client.publicPage.findFirst({
        where: { tenantId: input.tenantId, slug, status: 'published' },
        include: sharedInclude,
      });

      return fallbackPage ? mapPublicPageRecord(fallbackPage) : null;
    },

    async findPageBySlug(input: { tenantId: string; slug?: string; locale?: string }): Promise<PublicPageRecord | null> {
      const sharedInclude = {
        blocks: { orderBy: { position: 'asc' } },
        tenant: { include: { services: { where: { active: true } }, locations: { where: { active: true } } } },
      } as const;
      const slug = input.slug ?? 'home';
      const locale = input.locale ?? 'en';

      const page = await client.publicPage.findFirst({
        where: { tenantId: input.tenantId, slug, locale },
        include: sharedInclude,
      });

      if (page) return mapPublicPageRecord(page);

      const fallbackPage = await client.publicPage.findFirst({
        where: { tenantId: input.tenantId, slug },
        include: sharedInclude,
      });

      return fallbackPage ? mapPublicPageRecord(fallbackPage) : null;
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
    seo: cloneJsonValue(page.seo),
    status: page.status,
    layoutPreset: page.layoutPreset,
    blocks: page.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      variant: block.variant,
      props: cloneJsonValue(block.props),
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
      address: cloneJsonValue(location.address),
      phone: location.phone,
      email: location.email,
    })),
  };
}

function cloneJsonValue<T>(value: T): T {
  if (value === null || value === undefined) return value;
  return typeof structuredClone === 'function' ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);
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

export type QuoteRequestOutputMode = 'quote' | 'confirmation';
export type QuoteQuestionType = 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'select' | 'radio' | 'checkbox' | 'date';

export interface QuoteRequestPricingRule {
  id: string;
  kind: 'set' | 'add' | 'subtract' | 'multiply' | 'minimum' | 'maximum';
  amountMinor?: number;
  multiplier?: number;
  when?: { equals?: string; contains?: string; truthy?: boolean };
  note?: string;
}

export interface QuoteRequestQuestionOption {
  label: string;
  value: string;
  priceMinor?: number;
  pricingRules?: QuoteRequestPricingRule[];
}

export interface QuoteRequestQuestion {
  id: string;
  label: string;
  helpText?: string;
  type: QuoteQuestionType;
  required?: boolean;
  placeholder?: string;
  options?: QuoteRequestQuestionOption[];
  pricingRules?: QuoteRequestPricingRule[];
}

export interface QuoteRequestLeadField {
  key: 'firstName' | 'lastName' | 'displayName' | 'email' | 'phone' | 'company' | 'message' | string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  placeholder?: string;
}

export interface QuoteRequestModuleConfig {
  title: string;
  intro?: string;
  recipientEmail?: string;
  replyToEmail?: string;
  outputMode: QuoteRequestOutputMode;
  currency: string;
  basePriceMinor?: number;
  estimatedLabel?: string;
  successTitle?: string;
  successBody?: string;
  leadFields: QuoteRequestLeadField[];
  questions: QuoteRequestQuestion[];
  wizardStyle?: 'centered-card' | 'compact' | 'split';
  stepTransition?: 'fade' | 'slide' | 'zoom' | 'none';
}

export interface QuoteRequestEstimateLine {
  label: string;
  kind: 'base' | 'rule' | 'option';
  amountMinor: number;
  note?: string;
}

export interface QuoteRequestEstimate {
  currency: string;
  totalMinor: number;
  lines: QuoteRequestEstimateLine[];
}

export interface QuoteRequestSubmissionInput {
  tenantId: string;
  enabledModules: string[];
  config: QuoteRequestModuleConfig;
  answers: Record<string, unknown>;
  lead: { firstName?: string; lastName?: string; displayName: string; email?: string; phone?: string; company?: string; message?: string };
}

export interface QuoteRequestRecord {
  id: string;
  publicToken: string;
  tenantId: string;
  customerId?: string | null;
  status: string;
  outputMode: QuoteRequestOutputMode;
  recipientEmail?: string | null;
  requesterName: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requesterCompany?: string | null;
  answers: Prisma.JsonValue;
  quoteBreakdown: Prisma.JsonValue;
  quoteMinor?: number | null;
  currency?: string | null;
  configSnapshot: Prisma.JsonValue;
  submittedAt: Date;
}

type QuoteRequestNotificationSender = (input: {
  tenantId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  context: 'tenant' | 'requester';
  quoteRequest: QuoteRequestRecord;
}) => Promise<void> | void;

type QuoteRequestClient = {
  tenantModule: {
    findUnique(args: unknown): Promise<{ config: Prisma.JsonValue; enabled: boolean } | null>;
    upsert(args: unknown): Promise<unknown>;
  };
  quoteRequest?: {
    create(args: unknown): Promise<QuoteRequestRecord>;
    findMany(args: unknown): Promise<QuoteRequestRecord[]>;
    findFirst(args: unknown): Promise<QuoteRequestRecord | null>;
  };
  customer?: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
    update(args: unknown): Promise<{ id: string }>;
  };
  customerTimelineEvent?: { create(args: unknown): Promise<unknown> };
  eventOutbox?: { create(args: { data: Prisma.EventOutboxUncheckedCreateInput }): unknown };
};

export function createQuoteRequestService(
  client: QuoteRequestClient = prisma as unknown as QuoteRequestClient,
  _options: { sendNotification?: QuoteRequestNotificationSender } = {},
) {
  return {
    async getConfig(input: { tenantId: string }): Promise<QuoteRequestModuleConfig> {
      const module = await client.tenantModule.findUnique({ where: { tenantId_moduleId: { tenantId: input.tenantId, moduleId: 'quote-request' } } });
      return normalizeQuoteRequestConfig(isPlainObject(module?.config) ? module.config : undefined);
    },

    async saveConfig(input: { tenantId: string; config: QuoteRequestModuleConfig; enabled?: boolean }) {
      const current = await client.tenantModule.findUnique({ where: { tenantId_moduleId: { tenantId: input.tenantId, moduleId: 'quote-request' } } });
      return client.tenantModule.upsert({
        where: { tenantId_moduleId: { tenantId: input.tenantId, moduleId: 'quote-request' } },
        update: { enabled: current?.enabled ?? input.enabled ?? true, config: input.config },
        create: { tenantId: input.tenantId, moduleId: 'quote-request', enabled: input.enabled ?? true, config: input.config },
      });
    },

    listRequests(input: { tenantId: string; take?: number }) {
      const quoteRequest = client.quoteRequest;
      if (!quoteRequest) return Promise.resolve([]);
      return quoteRequest.findMany({ where: { tenantId: input.tenantId }, orderBy: { submittedAt: 'desc' }, take: input.take ?? 25 });
    },

    async getRequestByToken(input: { tenantId: string; publicToken: string }) {
      const quoteRequest = client.quoteRequest;
      if (!quoteRequest) return null;
      return quoteRequest.findFirst({ where: { tenantId: input.tenantId, publicToken: input.publicToken } });
    },

    async submit(input: QuoteRequestSubmissionInput) {
      const estimate = calculateQuoteRequestEstimate(input.config, input.answers);
      const requestId = globalThis.crypto.randomUUID();
      const publicToken = Buffer.from(`${requestId}:${input.lead.email ?? input.lead.displayName}`).toString('base64url').slice(0, 44);
      const requesterEmail = normalizeOptionalString(input.lead.email);
      const recipientEmail = normalizeOptionalString(input.config.recipientEmail);

      const quoteRequestDelegate = client.quoteRequest;
      if (!quoteRequestDelegate) throw new Error('Quote request persistence is unavailable.');

      const customer = await upsertQuoteRequestCustomer(client, input);
      const quoteRequest = await quoteRequestDelegate.create({
        data: {
          id: requestId,
          tenantId: input.tenantId,
          customerId: customer?.id,
          publicToken,
          status: 'submitted',
          outputMode: input.config.outputMode,
          recipientEmail,
          requesterName: input.lead.displayName,
          requesterEmail,
          requesterPhone: normalizeOptionalString(input.lead.phone),
          requesterCompany: normalizeOptionalString(input.lead.company),
          answers: input.answers,
          quoteBreakdown: estimate.lines,
          quoteMinor: input.config.outputMode === 'quote' ? estimate.totalMinor : null,
          currency: estimate.currency,
          configSnapshot: input.config,
        },
      });

      await client.eventOutbox?.create({
        data: {
          tenantId: input.tenantId,
          eventType: 'quote.requested',
          aggregateType: 'quote_request',
          aggregateId: quoteRequest.id,
          payload: {
            publicToken: quoteRequest.publicToken,
            requesterName: quoteRequest.requesterName,
            requesterEmail: quoteRequest.requesterEmail,
            recipientEmail: quoteRequest.recipientEmail,
            outputMode: quoteRequest.outputMode,
            quoteMinor: quoteRequest.quoteMinor,
            currency: quoteRequest.currency,
          },
        },
      });

      if (input.enabledModules.includes('notifications')) {
        if (recipientEmail) {
          const tenantPayload = buildQuoteEmailPayload(input.config, quoteRequest, estimate, 'tenant');
          await client.eventOutbox?.create({
            data: {
              tenantId: input.tenantId,
              eventType: 'notification.requested',
              aggregateType: 'notification',
              aggregateId: quoteRequest.id,
              payload: {
                channel: 'email',
                templateId: 'quote-request-tenant',
                recipientId: recipientEmail,
                data: tenantPayload,
              },
            },
          });
        }
        if (requesterEmail) {
          const requesterPayload = buildQuoteEmailPayload(input.config, quoteRequest, estimate, 'requester');
          await client.eventOutbox?.create({
            data: {
              tenantId: input.tenantId,
              eventType: 'notification.requested',
              aggregateType: 'notification',
              aggregateId: quoteRequest.id,
              payload: {
                channel: 'email',
                templateId: 'quote-request-confirmation',
                recipientId: requesterEmail,
                data: requesterPayload,
              },
            },
          });
        }
      }

      return { quoteRequest, estimate };
    },
  };
}

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeQuoteRequestConfig(input: Record<string, unknown> | undefined): QuoteRequestModuleConfig {
  const record = input ?? {};
  return {
    title: typeof record.title === 'string' && record.title.trim() ? record.title : 'Request a quote',
    intro: typeof record.intro === 'string' ? record.intro : 'Answer a few questions and we will get back to you with a tailored estimate.',
    recipientEmail: normalizeOptionalString(record.recipientEmail ?? record.recipient_email ?? record.email) ?? undefined,
    replyToEmail: normalizeOptionalString(record.replyToEmail) ?? undefined,
    outputMode: record.outputMode === 'confirmation' ? 'confirmation' : 'quote',
    currency: typeof record.currency === 'string' && record.currency.trim() ? record.currency : 'EUR',
    basePriceMinor: typeof record.basePriceMinor === 'number' ? record.basePriceMinor : 0,
    estimatedLabel: typeof record.estimatedLabel === 'string' ? record.estimatedLabel : 'Estimated price',
    successTitle: typeof record.successTitle === 'string' ? record.successTitle : 'Request received',
    successBody: typeof record.successBody === 'string' ? record.successBody : 'We will review your request and contact you shortly.',
    leadFields: normalizeLeadFields(record.leadFields),
    questions: normalizeQuoteQuestions(record.questions),
    wizardStyle: record.wizardStyle === 'compact' || record.wizardStyle === 'split' ? record.wizardStyle : 'centered-card',
    stepTransition: record.stepTransition === 'fade' || record.stepTransition === 'slide' || record.stepTransition === 'zoom' || record.stepTransition === 'none' ? record.stepTransition : 'slide',
  };
}

function normalizeLeadFields(value: unknown): QuoteRequestLeadField[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      { key: 'displayName', label: 'Full name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'message', label: 'Additional context', type: 'textarea' },
    ];
  }

  return value
    .map((item): QuoteRequestLeadField | null => {
      const record = toRecord(item);
      const key = typeof record.key === 'string' && record.key.trim() ? record.key : '';
      const label = typeof record.label === 'string' && record.label.trim() ? record.label : '';
      const type = record.type === 'email' || record.type === 'tel' || record.type === 'textarea' ? record.type : 'text';
      if (!key || !label) return null;
      return {
        key,
        label,
        type,
        required: typeof record.required === 'boolean' ? record.required : false,
        placeholder: typeof record.placeholder === 'string' ? record.placeholder : undefined,
      };
    })
    .filter((field): field is QuoteRequestLeadField => field !== null);
}

function normalizeQuoteQuestions(value: unknown): QuoteRequestQuestion[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      { id: 'scope', label: 'What do you need?', type: 'textarea', required: true, helpText: 'Tell us about the project, timeline, or preferences.' },
      { id: 'size', label: 'How large is the project?', type: 'select', required: true, options: [{ label: 'Small', value: 'small', priceMinor: 0 }, { label: 'Medium', value: 'medium', priceMinor: 15000 }, { label: 'Large', value: 'large', priceMinor: 35000 }] },
      { id: 'deadline', label: 'When do you need it?', type: 'select', options: [{ label: 'ASAP', value: 'asap', priceMinor: 10000 }, { label: 'Flexible', value: 'flexible', priceMinor: 0 }] },
    ];
  }

  return value
    .map((item): QuoteRequestQuestion | null => {
      const record = toRecord(item);
      const id = typeof record.id === 'string' && record.id.trim() ? record.id : '';
      const label = typeof record.label === 'string' && record.label.trim() ? record.label : '';
      if (!id || !label) return null;
      const type = isQuoteQuestionType(record.type) ? record.type : 'text';
      return {
        id,
        label,
        helpText: typeof record.helpText === 'string' ? record.helpText : undefined,
        type,
        required: typeof record.required === 'boolean' ? record.required : false,
        placeholder: typeof record.placeholder === 'string' ? record.placeholder : undefined,
        options: normalizeQuoteQuestionOptions(record.options),
        pricingRules: normalizeQuotePricingRules(record.pricingRules),
      };
    })
    .filter((question): question is QuoteRequestQuestion => question !== null);
}

function normalizeQuoteQuestionOptions(value: unknown): QuoteRequestQuestionOption[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const options = value
    .map((item): QuoteRequestQuestionOption | null => {
      const record = toRecord(item);
      const label = typeof record.label === 'string' && record.label.trim() ? record.label : '';
      const optionValue = typeof record.value === 'string' && record.value.trim() ? record.value : '';
      if (!label || !optionValue) return null;
      return {
        label,
        value: optionValue,
        priceMinor: typeof record.priceMinor === 'number' ? record.priceMinor : undefined,
        pricingRules: normalizeQuotePricingRules(record.pricingRules),
      };
    })
    .filter((option): option is QuoteRequestQuestionOption => option !== null);
  return options.length ? options : undefined;
}

function normalizeQuotePricingRules(value: unknown): QuoteRequestPricingRule[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const rules = value
    .map((item, index): QuoteRequestPricingRule | null => {
      const record = toRecord(item);
      const id = typeof record.id === 'string' && record.id.trim() ? record.id : `rule-${index}`;
      const kind = record.kind === 'set' || record.kind === 'add' || record.kind === 'subtract' || record.kind === 'multiply' || record.kind === 'minimum' || record.kind === 'maximum' ? record.kind : 'add';
      return {
        id,
        kind,
        amountMinor: typeof record.amountMinor === 'number' ? record.amountMinor : undefined,
        multiplier: typeof record.multiplier === 'number' ? record.multiplier : undefined,
        when: isPlainObject(record.when)
          ? (() => {
              const when = record.when as Record<string, unknown>;
              return {
                ...(typeof when.equals === 'string' ? { equals: when.equals } : {}),
                ...(typeof when.contains === 'string' ? { contains: when.contains } : {}),
                ...(typeof when.truthy === 'boolean' ? { truthy: when.truthy } : {}),
              };
            })()
          : undefined,
        note: typeof record.note === 'string' ? record.note : undefined,
      };
    })
    .filter((rule): rule is QuoteRequestPricingRule => rule !== null);
  return rules.length ? rules : undefined;
}

function isQuoteQuestionType(value: unknown): value is QuoteQuestionType {
  return value === 'text' || value === 'textarea' || value === 'email' || value === 'tel' || value === 'number' || value === 'select' || value === 'radio' || value === 'checkbox' || value === 'date';
}

function calculateQuoteRequestEstimate(config: QuoteRequestModuleConfig, answers: Record<string, unknown>): QuoteRequestEstimate {
  let totalMinor = config.basePriceMinor ?? 0;
  const lines: QuoteRequestEstimateLine[] = config.basePriceMinor ? [{ label: 'Base quote', kind: 'base', amountMinor: config.basePriceMinor, note: 'Starting point' }] : [];

  for (const question of config.questions) {
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === '') continue;

    if (question.type === 'select' || question.type === 'radio') {
      const selected = question.options?.find((option) => option.value === answer);
      if (typeof selected?.priceMinor === 'number') {
        totalMinor += selected.priceMinor;
        lines.push({ label: `${question.label}: ${selected.label}`, kind: 'option', amountMinor: selected.priceMinor });
      }
      if (selected?.pricingRules?.length) {
        const result = applyPricingRules(totalMinor, selected.pricingRules, answer, question.label);
        totalMinor = result.totalMinor;
        lines.push(...result.lines);
      }
    }

    const result = applyPricingRules(totalMinor, question.pricingRules, answer, question.label);
    totalMinor = result.totalMinor;
    lines.push(...result.lines);

    if (Array.isArray(answer) && question.type === 'checkbox') {
      for (const selectedValue of answer.filter((item): item is string => typeof item === 'string')) {
        const selected = question.options?.find((option) => option.value === selectedValue);
        if (typeof selected?.priceMinor === 'number') {
          totalMinor += selected.priceMinor;
          lines.push({ label: `${question.label}: ${selected.label}`, kind: 'option', amountMinor: selected.priceMinor });
        }
      }
    }
  }

  return { currency: config.currency, totalMinor, lines };
}

function applyPricingRules(currentTotal: number, rules: QuoteRequestPricingRule[] | undefined, answer: unknown, label: string): { totalMinor: number; lines: QuoteRequestEstimateLine[] } {
  if (!rules?.length) return { totalMinor: currentTotal, lines: [] };
  let totalMinor = currentTotal;
  const lines: QuoteRequestEstimateLine[] = [];

  for (const rule of rules) {
    if (!pricingRuleMatches(rule, answer)) continue;
    const amountMinor = rule.amountMinor ?? 0;
    if (rule.kind === 'set') {
      totalMinor = amountMinor;
      lines.push({ label, kind: 'rule', amountMinor, note: rule.note ?? 'Set by rule' });
    } else if (rule.kind === 'subtract') {
      totalMinor -= amountMinor;
      lines.push({ label, kind: 'rule', amountMinor: -amountMinor, note: rule.note });
    } else if (rule.kind === 'multiply') {
      const multiplier = rule.multiplier ?? 1;
      totalMinor = Math.round(totalMinor * multiplier);
      lines.push({ label, kind: 'rule', amountMinor: Math.round(currentTotal * (multiplier - 1)), note: rule.note ?? `×${multiplier}` });
    } else if (rule.kind === 'minimum') {
      totalMinor = Math.max(totalMinor, amountMinor);
      lines.push({ label, kind: 'rule', amountMinor: Math.max(0, amountMinor - currentTotal), note: rule.note ?? 'Minimum applied' });
    } else if (rule.kind === 'maximum') {
      totalMinor = Math.min(totalMinor, amountMinor);
      lines.push({ label, kind: 'rule', amountMinor: Math.min(0, amountMinor - currentTotal), note: rule.note ?? 'Maximum applied' });
    } else {
      totalMinor += amountMinor;
      lines.push({ label, kind: 'rule', amountMinor, note: rule.note });
    }
  }

  return { totalMinor, lines };
}

function pricingRuleMatches(rule: QuoteRequestPricingRule, answer: unknown): boolean {
  const when = rule.when;
  if (!when) return true;
  const value = Array.isArray(answer) ? answer.join(' ') : String(answer ?? '');
  if (typeof when.truthy === 'boolean') return when.truthy ? Boolean(answer) : !answer;
  if (typeof when.equals === 'string' && value !== when.equals) return false;
  if (typeof when.contains === 'string' && !value.includes(when.contains)) return false;
  return true;
}

function buildQuoteEmailPayload(
  config: QuoteRequestModuleConfig,
  quoteRequest: QuoteRequestRecord,
  estimate: QuoteRequestEstimate,
  target: 'tenant' | 'requester',
): Prisma.InputJsonObject {
  const subject =
    target === 'tenant'
      ? `${config.title} — new quote request`
      : `We received your quote request — ${config.title}`;

  return {
    target,
    title: config.title,
    subject,
    body: renderQuoteRequestEmailBody(config, quoteRequest, estimate, target),
    replyTo: target === 'tenant' ? quoteRequest.requesterEmail : quoteRequest.recipientEmail,
    outputMode: quoteRequest.outputMode,
    requesterName: quoteRequest.requesterName,
    requesterEmail: quoteRequest.requesterEmail,
    recipientEmail: quoteRequest.recipientEmail,
    currency: estimate.currency,
    quoteMinor: quoteRequest.quoteMinor,
    breakdown: estimate.lines as unknown as Prisma.InputJsonValue,
    answers: quoteRequest.answers as unknown as Prisma.InputJsonValue,
  };
}

function renderQuoteRequestEmailBody(
  config: QuoteRequestModuleConfig,
  quoteRequest: QuoteRequestRecord,
  estimate: QuoteRequestEstimate,
  target: 'tenant' | 'requester',
): string {
  const summary = [
    `Request: ${config.title}`,
    `From: ${quoteRequest.requesterName}${quoteRequest.requesterEmail ? ` <${quoteRequest.requesterEmail}>` : ''}`,
    `Output: ${quoteRequest.outputMode}`,
    quoteRequest.quoteMinor != null ? `Estimate: ${formatMoney(quoteRequest.quoteMinor, estimate.currency)}` : null,
    '',
    'Answers:',
    JSON.stringify(quoteRequest.answers, null, 2),
  ].filter((line): line is string => Boolean(line));

  return target === 'tenant'
    ? `New quote request for ${config.title}\n\n${summary.join('\n')}`
    : `Thank you for your quote request.\n\n${summary.join('\n')}`;
}

async function upsertQuoteRequestCustomer(transaction: QuoteRequestClient, input: QuoteRequestSubmissionInput): Promise<{ id: string } | null> {
  if (!input.enabledModules.includes('crm') || !transaction.customer) return null;
  const existing = input.lead.email
    ? await transaction.customer.findFirst({ where: { tenantId: input.tenantId, email: input.lead.email } })
    : null;
  const data = {
    profileKind: 'lead',
    firstName: input.lead.firstName,
    lastName: input.lead.lastName,
    displayName: input.lead.displayName,
    email: input.lead.email,
    phone: input.lead.phone,
    metadata: { source: 'quote_request', company: input.lead.company },
  };
  if (existing) {
    return transaction.customer.update({ where: { id: existing.id }, data });
  }
  return transaction.customer.create({ data: { tenantId: input.tenantId, ...data } });
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amountMinor / 100);
}

export type CrmProfileKind = 'customer' | 'patient';

export interface CrmLabels {
  singular: string;
  plural: string;
  bookingSingular: string;
  bookingPlural: string;
}

export function getCrmLabels(input: { profileKind?: string | null; verticalType?: string | null; tenantModules?: string[] } = {}): CrmLabels {
  const isClinic = input.profileKind === 'patient' || input.verticalType === 'clinic';
  return isClinic
    ? { singular: 'Patient', plural: 'Patients', bookingSingular: 'Appointment', bookingPlural: 'Appointments' }
    : { singular: 'Customer', plural: 'Customers', bookingSingular: 'Booking', bookingPlural: 'Bookings' };
}

export interface CrmCustomerListItem {
  id: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  profileKind: string;
  updatedAt: Date;
}

export interface CrmTimelineItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  occurredAt: Date;
  payload?: Prisma.JsonValue;
}

export interface CrmCustomerNoteRecord {
  id: string;
  body: string;
  visibility: string;
  createdAt: Date;
  authorName?: string | null;
}

export interface CrmCustomerProfile extends CrmCustomerListItem {
  firstName?: string | null;
  lastName?: string | null;
  notes: CrmCustomerNoteRecord[];
  timeline: CrmTimelineItem[];
  customFields: Array<{ id: string; key: string; label: string; fieldType: string; required: boolean; options?: Prisma.JsonValue }>;
}

type CrmClient = {
  customer: {
    findMany(args: unknown): Promise<CrmCustomerListItem[]>;
    findFirst(args: unknown): Promise<(CrmCustomerListItem & { firstName?: string | null; lastName?: string | null }) | null>;
  };
  customerNote: {
    findMany(args: unknown): Promise<Array<{ id: string; body: string; visibility: string; createdAt: Date; author?: { displayName?: string | null } | null }>>;
    create(args: unknown): Promise<{ id: string; body: string; visibility: string; createdAt: Date; author?: { displayName?: string | null } | null }>;
  };
  customerTimelineEvent: {
    findMany(args: unknown): Promise<Array<{ id: string; eventType: string; payload: Prisma.JsonValue; occurredAt: Date }>>;
    create(args: unknown): Promise<unknown>;
  };
  customFieldDefinition: {
    findMany(args: unknown): Promise<Array<{ id: string; key: string; label: string; fieldType: string; required: boolean; options?: Prisma.JsonValue }>>;
    create(args: unknown): Promise<unknown>;
  };
};

export function createCrmService(client: CrmClient = prisma as unknown as CrmClient) {
  return {
    searchCustomers(input: { tenantId: string; query?: string; take?: number }): Promise<CrmCustomerListItem[]> {
      const search = input.query?.trim();
      return client.customer.findMany({
        where: {
          tenantId: input.tenantId,
          ...(search
            ? {
                OR: [
                  { displayName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: { id: true, displayName: true, email: true, phone: true, profileKind: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: input.take ?? 25,
      });
    },

    async getCustomerProfile(input: { tenantId: string; customerId: string }): Promise<CrmCustomerProfile | null> {
      const customer = await client.customer.findFirst({
        where: { tenantId: input.tenantId, id: input.customerId },
        select: { id: true, displayName: true, firstName: true, lastName: true, email: true, phone: true, profileKind: true, updatedAt: true },
      });
      if (!customer) return null;

      const [notes, events, customFields] = await Promise.all([
        client.customerNote.findMany({
          where: { tenantId: input.tenantId, customerId: input.customerId },
          include: { author: { select: { displayName: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        client.customerTimelineEvent.findMany({
          where: { tenantId: input.tenantId, customerId: input.customerId, eventType: { not: 'customer.note.created' } },
          orderBy: { occurredAt: 'desc' },
        }),
        client.customFieldDefinition.findMany({ where: { tenantId: input.tenantId, entityType: 'customer', active: true }, orderBy: { position: 'asc' } }),
      ]);

      const mappedNotes = notes.map(mapCrmNoteRecord);
      return {
        ...customer,
        notes: mappedNotes,
        customFields,
        timeline: mergeCrmTimeline(mappedNotes, events),
      };
    },

    async addCustomerNote(input: { tenantId: string; customerId: string; authorUserId?: string | null; body: string; visibility?: string }) {
      const note = await client.customerNote.create({
        data: {
          tenantId: input.tenantId,
          customerId: input.customerId,
          authorUserId: input.authorUserId,
          body: input.body,
          visibility: input.visibility ?? 'internal',
        },
      });

      await client.customerTimelineEvent.create({
        data: {
          tenantId: input.tenantId,
          customerId: input.customerId,
          eventType: 'customer.note.created',
          aggregateType: 'customer_note',
          aggregateId: note.id,
          payload: { body: input.body, visibility: note.visibility },
        },
      });

      return note;
    },

    listCustomFieldDefinitions(input: { tenantId: string }) {
      return client.customFieldDefinition.findMany({ where: { tenantId: input.tenantId, entityType: 'customer', active: true }, orderBy: { position: 'asc' } });
    },

    createCustomFieldDefinition(input: { tenantId: string; key: string; label: string; fieldType: string; required?: boolean; options?: Prisma.InputJsonValue; position?: number }) {
      return client.customFieldDefinition.create({
        data: {
          tenantId: input.tenantId,
          entityType: 'customer',
          key: input.key,
          label: input.label,
          fieldType: input.fieldType,
          required: input.required ?? false,
          options: input.options,
          position: input.position ?? 0,
          active: true,
        },
      });
    },
  };
}

function mapCrmNoteRecord(note: { id: string; body: string; visibility: string; createdAt: Date; author?: { displayName?: string | null } | null }): CrmCustomerNoteRecord {
  return { id: note.id, body: note.body, visibility: note.visibility, createdAt: note.createdAt, authorName: note.author?.displayName };
}

function mergeCrmTimeline(
  notes: CrmCustomerNoteRecord[],
  events: Array<{ id: string; eventType: string; payload: Prisma.JsonValue; occurredAt: Date }>,
): CrmTimelineItem[] {
  const noteItems = notes.map((note) => ({ id: note.id, type: 'customer.note.created', title: 'Note added', body: note.body, occurredAt: note.createdAt }));
  const eventItems = events.map((event) => ({
    id: event.id,
    type: event.eventType,
    title: event.eventType === 'booking.created' ? 'Appointment booked' : event.eventType,
    occurredAt: event.occurredAt,
    payload: event.payload,
  }));
  return [...noteItems, ...eventItems].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
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

export interface EmailDeliveryMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
  from?: string | null;
}

export function createEmailDeliveryService(options: {
  provider?: string;
  apiKey?: string;
  from?: string;
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
} = {}) {
  const provider = (options.provider ?? process.env.EMAIL_PROVIDER ?? 'log').toLowerCase();
  const apiKey = options.apiKey ?? process.env.EMAIL_API_KEY ?? '';
  const from = options.from ?? process.env.EMAIL_FROM ?? 'MARGO <no-reply@margo.local>';
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;

  return {
    provider,
    async send(message: EmailDeliveryMessage) {
      if (provider === 'log') {
        logger.info(`[email:${provider}] to=${message.to} subject=${message.subject}\n${message.text}`);
        return;
      }

      if (!apiKey) {
        throw new Error(`EMAIL_API_KEY is required for provider "${provider}".`);
      }

      if (provider === 'resend') {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: message.from ?? from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            reply_to: message.replyTo ?? undefined,
          }),
        });
        if (!response.ok) {
          throw new Error(`Resend email delivery failed with status ${response.status}.`);
        }
        return;
      }

      if (provider === 'postmark') {
        const response = await fetchImpl('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': apiKey,
          },
          body: JSON.stringify({
            From: message.from ?? from,
            To: message.to,
            Subject: message.subject,
            TextBody: message.text,
            ReplyTo: message.replyTo ?? undefined,
          }),
        });
        if (!response.ok) {
          throw new Error(`Postmark email delivery failed with status ${response.status}.`);
        }
        return;
      }

      throw new Error(`Unsupported EMAIL_PROVIDER "${provider}".`);
    },
  };
}

export function createNotificationOutboxWorker(client: NotificationOutboxClient = prisma as unknown as NotificationOutboxClient, options: { mailer?: ReturnType<typeof createEmailDeliveryService>; take?: number } = {}) {
  const mailer = options.mailer ?? createEmailDeliveryService();

  return {
    async processPending() {
      const pending = await client.eventOutbox.findMany({
        where: { eventType: 'notification.requested', status: 'pending', nextAttemptAt: { lte: new Date() } },
        orderBy: [{ createdAt: 'asc' }],
        take: options.take ?? 20,
      });

      let processed = 0;
      let failed = 0;

      for (const event of pending) {
        try {
          const request = normalizeNotificationRequestedEvent(event.payload);
          await mailer.send(request);
          await client.eventOutbox.update({ where: { id: event.id }, data: { status: 'processed', processedAt: new Date() } });
          processed += 1;
        } catch (error) {
          failed += 1;
          const attempts = (event.attempts ?? 0) + 1;
          await client.eventOutbox.update({
            where: { id: event.id },
            data: {
              attempts,
              status: attempts >= 5 ? 'failed' : 'pending',
              nextAttemptAt: new Date(Date.now() + retryDelayMs(attempts)),
            },
          });
          if (options.mailer?.provider !== 'log') {
            console.warn('Notification delivery failed', error);
          }
        }
      }

      return { processed, failed, attempted: pending.length };
    },
  };
}

type NotificationOutboxClient = {
  eventOutbox: {
    findMany(args: unknown): Promise<Array<{ id: string; payload: Prisma.JsonValue; attempts: number }>>;
    update(args: unknown): Promise<unknown>;
  };
};

function normalizeNotificationRequestedEvent(payload: Prisma.JsonValue): EmailDeliveryMessage {
  const record = isPlainObject(payload) ? payload : {};
  const data = isPlainObject(record.data) ? record.data : {};
  const subject = typeof data.subject === 'string' ? data.subject : typeof record.templateId === 'string' ? record.templateId : 'Notification';
  const text = typeof data.body === 'string' ? data.body : JSON.stringify(data, null, 2);
  const replyTo = typeof data.replyTo === 'string' ? data.replyTo : undefined;
  const from = typeof data.from === 'string' ? data.from : undefined;
  const to = typeof record.recipientId === 'string' ? record.recipientId : '';

  if (!to) {
    throw new Error('Notification event is missing a recipient email.');
  }

  return { to, subject, text, replyTo, from };
}

function retryDelayMs(attempts: number): number {
  return Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempts - 1));
}
