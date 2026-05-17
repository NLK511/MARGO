import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { can } from '../../packages/core/src';
import { createDevSession, getAdminNavigation, getSurfaceNavigation, isSurfaceAllowed } from '../../apps/admin-web/app/admin-context';

describe('current MVP baseline', () => {
  it('keeps admin, tenant builder, and owner surfaces reachable by role', () => {
    const globalSession = createDevSession('oak-clinic', ['global_admin']);
    const tenantSession = createDevSession('oak-clinic', ['tenant_admin']);
    const ownerSession = createDevSession('oak-clinic', ['tenant_owner']);

    expect(can({ roles: globalSession.roles }, 'platform.themes.manage')).toBe(true);
    expect(isSurfaceAllowed('global-admin', globalSession)).toBe(true);
    expect(isSurfaceAllowed('tenant', tenantSession)).toBe(true);
    expect(isSurfaceAllowed('owner', ownerSession)).toBe(true);
    expect(getSurfaceNavigation('tenant', tenantSession).map((item) => item.path)).toContain('/tenant/pages');
    expect(getAdminNavigation(ownerSession).map((item) => item.path)).toContain('/owner');
  });

  it('keeps the current admin/public route files present', () => {
    const routeFiles = [
      'apps/admin-web/app/page.tsx',
      'apps/admin-web/app/login/page.tsx',
      'apps/admin-web/app/tenant/page.tsx',
      'apps/admin-web/app/owner/page.tsx',
      'apps/admin-web/app/global-admin/page.tsx',
      'apps/public-web/app/page.tsx',
      'apps/public-web/app/t/[tenantSlug]/page.tsx',
    ];

    for (const file of routeFiles) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });
});
