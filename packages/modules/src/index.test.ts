import { describe, expect, it } from 'vitest';
import {
  coreModuleManifests,
  createModuleRegistry,
  evaluateModuleRouteAccess,
  isTenantModuleEnabled,
  validateModuleDependencies,
} from './index';

describe('module registry', () => {
  it('loads core manifests with routes and permissions', () => {
    const registry = createModuleRegistry(coreModuleManifests);

    expect(registry.isInstalled('frontpage')).toBe(true);
    expect(registry.get('booking')?.dependencies).toEqual(['notifications']);
    expect(registry.get('crm')?.permissions.map((permission) => permission.permission)).toContain('crm.customer.read');
  });

  it('validates required module dependencies', () => {
    expect(validateModuleDependencies(['frontpage', 'booking'])).toEqual([
      { moduleId: 'booking', missingDependency: 'notifications' },
    ]);
    expect(validateModuleDependencies(['frontpage', 'notifications', 'booking'])).toEqual([]);
  });

  it('does not require optional dependencies', () => {
    expect(validateModuleDependencies(['crm'])).toEqual([]);
  });

  it('detects enabled modules that are not installed', () => {
    expect(validateModuleDependencies(['unknown-module'])).toEqual([
      { moduleId: 'unknown-module', missingDependency: 'unknown-module' },
    ]);
  });

  it('checks tenant module enablement', () => {
    expect(isTenantModuleEnabled(['frontpage'], 'frontpage')).toBe(true);
    expect(isTenantModuleEnabled(['frontpage'], 'booking')).toBe(false);
  });

  it('returns 404 for disabled module routes', () => {
    expect(evaluateModuleRouteAccess('booking', ['frontpage'])).toEqual({
      allowed: false,
      status: 404,
      reason: 'module_disabled',
    });
  });

  it('returns 403 for enabled module routes with missing dependencies', () => {
    expect(evaluateModuleRouteAccess('booking', ['frontpage', 'booking'])).toEqual({
      allowed: false,
      status: 403,
      reason: 'missing_dependency',
      missingDependencies: ['notifications'],
    });
  });
});
