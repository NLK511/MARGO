## Purpose

Manage customers/patients/guests and their relationship history.

## Entity Naming

Use `Customer` internally for all verticals.

Display label is configurable:

```json
{
  "customerLabelSingular": "Patient",
  "customerLabelPlural": "Patients"
}
```

## Admin Routes

```txt
/admin/customers
/admin/customers/:customerId
/admin/customers/:customerId/timeline
/admin/customers/:customerId/notes
/admin/customers/import
/admin/customers/settings/custom-fields
/admin/customers/settings/tags
```

## Customer Schema

```sql
create table customers (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  profile_kind text not null default 'customer',
  first_name text,
  last_name text,
  display_name text,
  email text,
  phone text,
  date_of_birth date,
  preferred_locale text,
  marketing_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_tenant_email_idx on customers (tenant_id, email);
create index customers_tenant_phone_idx on customers (tenant_id, phone);

create table customer_notes (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  author_user_id uuid references users(id),
  visibility text not null default 'internal',
  body text not null,
  created_at timestamptz not null default now()
);

create table customer_tags (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  color text,
  unique (tenant_id, name)
);

create table customer_tag_assignments (
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  tag_id uuid not null references customer_tags(id),
  primary key (tenant_id, customer_id, tag_id)
);
```

## Custom Fields

```sql
create table custom_field_definitions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  entity_type text not null,
  key text not null,
  label text not null,
  field_type text not null,
  required boolean not null default false,
  options jsonb,
  position int not null default 0,
  active boolean not null default true,
  unique (tenant_id, entity_type, key)
);

create table custom_field_values (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  entity_type text not null,
  entity_id uuid not null,
  field_definition_id uuid not null references custom_field_definitions(id),
  value jsonb,
  updated_at timestamptz not null default now()
);
```

## Timeline Event Types

- `customer.created`
- `booking.created`
- `booking.cancelled`
- `booking.completed`
- `note.created`
- `payment.succeeded`
- `form.submitted`
- `tag.added`

## CRM API

```txt
GET    /api/admin/customers
POST   /api/admin/customers
GET    /api/admin/customers/:id
PATCH  /api/admin/customers/:id
POST   /api/admin/customers/:id/notes
GET    /api/admin/customers/:id/timeline
POST   /api/admin/customers/import
GET    /api/admin/custom-fields
POST   /api/admin/custom-fields
PATCH  /api/admin/custom-fields/:id
```

## MVP Implementation Status

Implemented for MVP:

- Customer search/list service and admin screen.
- Customer profile service and admin screen.
- Customer note creation service and profile note form shell.
- Timeline merge for notes and booking-created events.
- Clinic labels: Customer/Customers become Patient/Patients and Booking/Bookings become Appointment/Appointments.
- Basic custom field definition service and settings screen shell.

Deferred post-MVP:

- CSV import with preview/validation.
- Full custom field value editing on customer profiles.

## Acceptance Criteria

- Staff can search customers.
- Staff can view customer profile.
- Staff can add notes.
- Booking events appear in timeline.
- Tenant can define custom fields.
- CSV import works with preview/validation. *(Post-MVP)*
- Clinic mode can relabel customer as patient.

---

