import { describe, expect, it } from 'vitest';
import { hasModule, type TenantContext } from './index';

describe('platform core bootstrap', () => {
  const tenant: TenantContext = {
    tenantId: 'tenant_demo',
    slug: 'demo',
    enabledModules: ['frontpage'],
    locale: 'en',
    timezone: 'Europe/Paris',
  };

  it('checks module enablement from tenant context', () => {
    expect(hasModule(tenant, 'frontpage')).toBe(true);
    expect(hasModule(tenant, 'booking')).toBe(false);
  });
});
