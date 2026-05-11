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
  apiRoutes: ApiRouteDefinition[];
  eventSubscriptions: EventSubscription[];
  menuItems: MenuItemDefinition[];
  widgets?: DashboardWidgetDefinition[];
}
```

## Module Enablement

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

