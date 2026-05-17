## Module Design Goal

Modules must be independently enableable per tenant and safely removable from UI routing without corrupting shared platform state.

## Core Module Interface

```ts
export type ModuleId =
  | 'frontpage'
  | 'booking'
  | 'crm'
  | 'payments'
  | 'notifications'
  | 'analytics'
  | string;

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  version: string;
  description: string;
  dependencies: ModuleId[];
  optionalDependencies?: ModuleId[];
  tenantConfigSchema: unknown;
  permissions: PermissionDefinition[];
  publicRoutes: RouteDefinition[];
  adminRoutes: RouteDefinition[];
  ownerRoutes?: RouteDefinition[];
  apiRoutes: ApiRouteDefinition[];
  eventSubscriptions: EventSubscription[];
  menuItems: MenuItemDefinition[];
  widgets?: DashboardWidgetDefinition[];
  exportAdapter?: ModuleExportAdapterDefinition;
}

export interface ModuleExportAdapterDefinition {
  currentVersion: string;
  exportKey: string;
  migrators: string[];
}
```

## Module Enablement

When a module is enabled, its public routes are surfaced in the admin page inventory as read-only, module-owned pages.

Database table:

```sql
create table tenant_modules (
  tenant_id uuid not null references tenants(id),
  module_id text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}',
  enabled_at timestamptz not null default now(),
  disabled_at timestamptz,
  primary key (tenant_id, module_id)
);
```

## Dependency Rules

- `booking` requires `notifications`.
- `booking` optionally uses `payments`.
- `crm` requires `booking` only if timeline includes bookings; otherwise it may run standalone.
- `frontpage` has no module dependency.
- `theme` is platform core, not optional.
- Module public routes should be discoverable from the admin page inventory and clearly marked as injected/managed by a module.
- Module admin routes are builder/configuration routes for tenant admins.
- Module owner routes are operational routes for tenant owners/staff and should not expose builder controls.
- Module-specific editors may expose extra UX controls such as quote-request wizard form style and next-step animation.
- Demo tenants use a seed-snapshot overlay: any editable module config stored in `tenant_modules` is captured and restored on reseed, and future module-owned tables should opt into the same snapshot contract via a dedicated adapter.
- Modules that own configurable data outside `tenant_modules` must define export/import adapters with versioned migrators.

## Future Module Examples

- loyalty
- memberships
- reviews
- inventory
- gift cards
- forms/intake
- marketing campaigns
- waitlist automation
- AI assistant, as future optional module only

---

