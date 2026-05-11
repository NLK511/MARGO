import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');

const businessModels = [
  'Domain',
  'Location',
  'User',
  'RoleBinding',
  'TenantModule',
  'TenantBranding',
  'AuditLog',
  'EventOutbox',
  'PublicPage',
  'PageBlock',
  'Service',
  'Resource',
  'Booking',
  'Customer',
  'CustomerNote',
  'CustomerTag',
  'CustomerTagAssignment',
  'CustomFieldDefinition',
  'CustomFieldValue',
  'CustomerTimelineEvent',
];

function getModelBlock(modelName: string): string {
  const match = schema.match(new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`));
  if (!match) {
    throw new Error(`Missing Prisma model ${modelName}`);
  }
  return match[0];
}

describe('database schema tenant safety', () => {
  it.each(businessModels)('%s includes a tenant id field mapped to tenant_id', (modelName) => {
    expect(getModelBlock(modelName)).toMatch(/tenantId\s+[^\n]+@map\("tenant_id"\)/);
  });

  it('defines unique tenant-scoped slugs for public pages and services', () => {
    expect(getModelBlock('PublicPage')).toContain('@@unique([tenantId, locale, slug])');
    expect(getModelBlock('Service')).toContain('@@unique([tenantId, slug])');
  });

  it('defines booking indexes needed for tenant-scoped lookup and slot checks', () => {
    const booking = getModelBlock('Booking');
    expect(booking).toContain('@@index([tenantId, startsAt])');
    expect(booking).toContain('@@index([tenantId, resourceId, startsAt])');
  });
});
