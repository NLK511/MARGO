## Purpose

Allow public customers/patients/guests to book reservations or appointments, and allow staff to manage them.

## Core Concepts

| Generic Term | Restaurant | Clinic | Salon |
|---|---|---|---|
| Customer | Guest | Patient | Client |
| Service | Reservation type/menu event | Appointment type | Treatment |
| Resource | Table/room | Clinician/room | Stylist/chair |
| Booking | Reservation | Appointment | Appointment |

## Public Booking Flow

1. Select location
2. Select service
3. Select date/time
4. Select resource preference if enabled
5. Enter customer details
6. Accept required policies/consents
7. Pay deposit if required
8. Confirm booking
9. Receive confirmation

## Public Routes

```txt
/book
/book/:serviceSlug
/booking/confirmation/:token
/manage-booking/:token
/manage-booking/:token/reschedule
/manage-booking/:token/cancel
```

## Admin Routes

```txt
/admin/bookings/calendar
/admin/bookings/list
/admin/bookings/:bookingId
/admin/bookings/settings/services
/admin/bookings/settings/resources
/admin/bookings/settings/availability
/admin/bookings/settings/policies
```

## Booking Statuses

```ts
type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_staff'
  | 'no_show'
  | 'rescheduled';
```

## Availability Rules

Availability is computed from:

- business hours
- service duration
- service buffers
- resource working hours
- blackout dates
- existing bookings
- capacity rules
- party size where applicable
- minimum notice period
- maximum booking horizon

## Tables

```sql
create table services (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid references locations(id),
  slug text not null,
  name text not null,
  description text,
  vertical_type text not null default 'generic',
  duration_minutes int not null,
  buffer_before_minutes int not null default 0,
  buffer_after_minutes int not null default 0,
  price_minor int,
  currency text,
  requires_payment boolean not null default false,
  deposit_minor int,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table resources (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid references locations(id),
  resource_type text not null,
  name text not null,
  capacity int,
  active boolean not null default true,
  metadata jsonb not null default '{}'
);

create table bookings (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  service_id uuid not null references services(id),
  resource_id uuid references resources(id),
  customer_id uuid not null references customers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null,
  source text not null default 'public_web',
  public_token text not null unique,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Booking API

```txt
POST /api/public/booking/availability/search
POST /api/public/bookings
GET  /api/public/bookings/:token
POST /api/public/bookings/:token/cancel
POST /api/public/bookings/:token/reschedule
GET  /api/admin/bookings
POST /api/admin/bookings
PATCH /api/admin/bookings/:id
POST /api/admin/bookings/:id/check-in
POST /api/admin/bookings/:id/no-show
```

## Acceptance Criteria

- Public user can create a booking.
- Double-booking is prevented transactionally.
- Booking confirmation email is queued.
- Staff can create/edit/cancel booking.
- Customer can cancel/reschedule through token link.
- Booking appears on CRM customer timeline if CRM is enabled.
- Payment deposit flow is optional by tenant/service.

---

