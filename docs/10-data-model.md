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

