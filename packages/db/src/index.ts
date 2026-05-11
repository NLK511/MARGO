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
