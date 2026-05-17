## Architecture Style

Use a modular monolith with strict internal module boundaries.

Do not start with microservices.

Reason:

- faster MVP delivery
- simpler local development
- easier transactional consistency
- still allows future extraction by module boundary

## High-Level Components

```txt
apps/
  public-web      public tenant webapps
  admin-web       tenant builder/admin and tenant owner/ops surfaces
  api             backend API
  worker          background/outbox workers

packages/
  core            tenant, auth, RBAC, config, logger
  ui              design system components
  themes          token system and presets
  modules         module contracts and manifests
  integrations    vendor adapters
  db              schema, migrations, seed
```

## Runtime Architecture

```txt
Public customer browser
  -> Tenant Resolver
  -> Public Webapp
  -> Module Services
  -> PostgreSQL

Tenant admin / owner browser
  -> Auth + RBAC
  -> Tenant Builder or Owner Portal
  -> Module Services
  -> PostgreSQL

Global admin browser
  -> Platform Auth + RBAC
  -> Global Studio
  -> Tenant/template/theme services
  -> PostgreSQL

Workers
  -> Outbox/Queue Workers
  -> External Integrations
```

## Core Services

### Tenant Resolver

Resolves tenant using:

1. custom domain hostname
2. subdomain
3. local development route prefix

Returns:

- tenant ID
- enabled modules
- theme preset
- layout config
- locale
- timezone
- feature flags

### Module Registry

Loads available modules and checks:

- whether module is installed globally
- whether module is enabled for tenant
- required dependencies
- exposed routes
- permissions
- migrations
- event handlers

### Configuration Service

Stores tenant-specific configuration:

- branding
- selected theme and tenant overrides
- pages and public app content
- module settings
- booking rules
- notification templates
- integrations
- CRM custom fields

Reusable white-label themes and templates are platform/global records managed through the Global Studio, not tenant branding records.

### Event Outbox

All side effects must go through durable events.

Examples:

- `booking.created`
- `booking.cancelled`
- `customer.created`
- `payment.succeeded`
- `notification.requested`

## Data Access Rules

- Every business table has `tenant_id`.
- All repository queries require tenant context.
- No service method should accept raw tenant IDs from client input without validation.
- Background jobs must carry tenant context explicitly.

---

