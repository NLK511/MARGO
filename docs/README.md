## Project Name

White-Label Modular SMB Webapp Platform

## Purpose

Build a modular, white-label platform for restaurants, clinics, salons, wellness studios, consultants, and similar small/medium businesses.

The platform must support independent deployment combinations:

1. Front page only
2. Front page + booking
3. Booking + CRM
4. Full suite: front page + booking + CRM
5. Future add-on modules through a stable module/plugin system

## Important Clarification

The resulting app does **not** need built-in agentic AI features. These specifications are designed to be consumed by an AI coding agent that will implement the app.

## Core Modules

- Frontpage / marketing website module
- Booking / appointment / reservation module
- Customer / patient / guest management CRM module
- Shared platform core
- Theme/layout customization system
- Plugin/module extension layer

## Reference Stack

Use this stack unless explicitly overridden:

- Frontend: Next.js, React, TypeScript
- UI: Tailwind CSS, CSS variables, headless accessible components
- Backend: NestJS or Next.js API layer with clean service boundaries
- Database: PostgreSQL
- ORM: Prisma or Drizzle
- Auth: Auth.js, Clerk, Supabase Auth, or Keycloak-compatible OIDC abstraction
- Payments: Stripe adapter
- Emails: Resend/Postmark adapter
- SMS: Twilio adapter
- Jobs: queue/outbox first; Temporal-compatible abstraction later
- Hosting: Docker + Vercel/Cloud Run/Fly.io-compatible deployment

## MVP Planning

The concrete MVP execution checklist is maintained in [`21-mvp-implementation-plan.md`](./21-mvp-implementation-plan.md). Update that file as tasks move from not started to in progress to done.

## Non-Negotiables

- Multi-tenant by design
- White-label branding by tenant
- Modular deployability
- Theme and layout presets
- Strong RBAC
- Accessibility baseline: WCAG 2.2 AA intent
- Responsive and reactive UI
- API-first architecture
- Seed data for restaurant and clinic demos
- Clear acceptance tests per module

---

