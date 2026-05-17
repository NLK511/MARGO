## Data Model Principles

- Tenant-owned tables must include `tenant_id` and tenant-scoped indexes where queried by tenant.
- Global platform tables must be explicitly documented as global and must not contain tenant business data.
- Foreign keys should cascade only where deleting a tenant intentionally deletes tenant-owned configuration/data.
- Business events and background jobs must store tenant context explicitly.
- Serializable tenant webapp configuration must have stable logical identifiers where possible, not only generated database IDs.
- Module-owned configurable data must define export/import shape and version migration rules.

## Core Tables

```sql
create table tenants (
  id uuid primary key,
  slug text not null unique,
  legal_name text not null,
  display_name text not null,
  primary_locale text not null default 'en',
  timezone text not null default 'Europe/Paris',
  default_currency text not null default 'EUR',
  plan text not null default 'starter',
  clinic_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table domains (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  hostname text not null unique,
  status text not null default 'pending',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  timezone text not null,
  address jsonb,
  phone text,
  email text,
  active boolean not null default true
);

create table users (
  id uuid primary key,
  tenant_id uuid references tenants(id),
  email text not null,
  display_name text,
  external_auth_id text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table role_bindings (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  user_id uuid not null references users(id),
  role text not null,
  scope_type text not null default 'tenant',
  scope_id uuid,
  created_at timestamptz not null default now()
);
```

## Branding Tables

```sql
create table tenant_branding (
  tenant_id uuid primary key references tenants(id),
  logo_url text,
  favicon_url text,
  theme_preset_id text not null default 'clinical-calm',
  theme_overrides jsonb not null default '{}',
  layout_config jsonb not null default '{}',
  typography_defaults jsonb not null default '{}',
  spacing_defaults jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
```

## Audit Tables

```sql
create table audit_logs (
  id uuid primary key,
  tenant_id uuid references tenants(id),
  actor_user_id uuid references users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
```

## Export/Import Metadata

Tenant webapp exports should be represented as versioned packages outside the live relational model. The live model should still support export/import by keeping stable fields and tenant-scoped ownership.

Recommended export package shape:

```json
{
  "kind": "margo.tenant-webapp-export",
  "exportVersion": "1.0.0",
  "sourceAppVersion": "0.0.0",
  "createdAt": "2026-05-11T00:00:00.000Z",
  "tenant": {},
  "theme": {},
  "branding": {},
  "modules": {},
  "pages": [],
  "assets": [],
  "migrations": []
}
```

Each module owns the shape under `modules[moduleId]` and must provide migrators for old export versions.

## Event Outbox

```sql
create table event_outbox (
  id uuid primary key,
  tenant_id uuid references tenants(id),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
```

---

