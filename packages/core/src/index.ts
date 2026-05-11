export type TenantId = string;

export interface TenantContext {
  tenantId: TenantId;
  slug: string;
  enabledModules: string[];
  locale: string;
  timezone: string;
}

export const MARGO_PLATFORM_NAME = 'MARGO';

export function hasModule(context: Pick<TenantContext, 'enabledModules'>, moduleId: string): boolean {
  return context.enabledModules.includes(moduleId);
}
