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
