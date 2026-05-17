## Product Overview

MARGO is an internal webapp factory and multi-tenant runtime platform for quickly producing polished, modern webapps for small and medium-sized businesses.

The commercial model is productized delivery:

- one-time setup/build fee, for example €5k
- yearly operational and ordinary maintenance fee, for example €700/year
- the reusable builder/studio remains an internal asset, not a default self-service SaaS product sold to every customer

Each customer business runs as a separate tenant. Tenants share the same platform codebase but have isolated data, branding, modules, and public routes.

Target businesses:

- restaurants
- clinics
- dentists
- physiotherapists
- salons
- spas
- gyms
- wellness studios
- consultants
- repair/service companies

## Product Surfaces

MARGO has four distinct surfaces.

### Global Admin / Studio

Internal platform surface used only by the MARGO platform owner/operator. In the current product model, this means only the platform creator has `global_admin` access; partner/reseller global access is deferred.

Responsibilities:

- create, archive, or delete tenants
- start tenants from reusable templates
- promote demo tenants into templates
- manage globally available modules
- define reusable white-label themes
- manage tenant lifecycle and support/debug tools

This surface is not customer-facing by default. It is part of the internal production advantage.

### Tenant Builder / Tenant Admin

Per-tenant configuration surface used by a tenant admin.

The tenant admin may be:

- a MARGO operator
- an implementation partner
- a technically capable customer user granted builder access

Responsibilities:

- configure tenant branding
- select and customize theme/layout settings
- edit public pages and page blocks
- configure modules and forms
- configure customer-facing behavior of the public webapp

The tenant admin is not necessarily the tenant owner.

### Tenant Owner Portal

Per-tenant operational surface used by the business owner/operator.

Responsibilities depend on enabled modules, for example:

- view reservations/bookings
- view quote requests and leads
- manage open days, hours, capacity, and calendar rules
- review customers/guests/patients
- review staff planning and operational reports

The tenant owner should not automatically have access to website design, page editing, theme construction, or global platform tools.

### Public Webapp

Customer-facing tenant webapp.

Properties:

- public, no login required for browsing
- can be a simple frontpage or a richer app
- can include booking, quote requests, payments, forms, and future modules
- fully tenant-branded and white-labeled

## User Personas and Roles

### Platform Operator / Global Admin

Runs the MARGO platform and provisions tenants.

Needs:

- tenant creation/deletion/archive
- template selection
- module enablement
- global theme and template management
- support/debug tools

### Tenant Admin / Builder User

Configures one tenant's webapp.

Needs:

- theme/branding/page/module editing
- preview and publishing tools
- module configuration forms
- asset upload and content editing

### Tenant Owner

Owns or operates the business.

Needs:

- operational dashboards
- bookings/quotes/customers/calendar views
- opening days and availability controls
- exports/reports where allowed

Does not necessarily need:

- page builder access
- theme editor access
- tenant deletion
- global template/theme creation

### Tenant Staff / Front Desk

Handles daily operations.

Needs:

- view calendar
- create/edit/cancel bookings
- check customers in
- update customer records
- take notes

### Provider / Clinician / Server / Resource Owner

Performs the service.

Needs:

- view assigned appointments
- add internal notes
- mark completion/no-show
- limited CRM access

### Customer / Patient / Guest

Uses public-facing flows.

Needs:

- browse business information
- book/reserve appointments
- request quotes
- manage/cancel/reschedule booking where supported
- receive confirmations/reminders

## Theme, Branding, and Templates

### Theme

A reusable white-label visual preset.

Contains:

- colors
- typography
- spacing/rhythm
- radii/shapes
- default layout style
- component visual tokens

Must not contain:

- tenant logo
- tenant logotype
- tenant photos
- tenant-specific copy

### Branding

Tenant-specific identity.

Contains:

- logo/logotype
- favicon
- tenant images
- tenant copy
- tenant-specific visual overrides

### Template

A reusable starter tenant configuration.

Contains:

- enabled modules
- default theme
- default pages/blocks
- default module settings
- default operational configuration

Demo tenants may be used as templates, but templates must be explicit artifacts rather than accidental database state.

## Module Packages

### Package A: Front Page Only

Includes:

- tenant resolution
- theme engine
- public page renderer
- page sections
- contact/lead forms
- SEO metadata

Excludes:

- booking engine
- CRM dashboard
- payments

### Package B: Front Page + Booking

Includes Package A plus:

- services/resources
- availability engine
- public booking flow
- booking management links
- notification templates
- optional payments/deposits

### Package C: Booking + CRM

Includes:

- booking staff dashboard
- customer/patient profiles
- notes/tags/timeline
- role-based access

May exclude:

- full marketing page builder if deployed as operational-only app

### Package D: Full Suite

Includes all current modules.

## Product Principles

- Internal builder/studio first; customer self-service only when explicitly enabled.
- Modular first.
- Business-outcome oriented.
- Configurable rather than forked.
- Reusable across verticals.
- Strict tenant data and access segregation by default.
- Tenant webapps must be serializable, exportable, and importable across platform versions.
- Webapp-created business data must be persisted safely with documented disaster recovery options.
- Aesthetic flexibility without breaking accessibility.
- Themes are reusable and white-labeled; branding is tenant-specific.
- Block typography and spacing can inherit from branding defaults and be overridden per block.
- Simple MVP path, extensible long-term architecture.

---
