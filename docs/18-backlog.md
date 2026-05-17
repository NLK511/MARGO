## P0 Backlog — Surface and RBAC Rework

- Define canonical roles: `global_admin`, `tenant_admin`, `tenant_owner`, `tenant_staff`, `provider`.
- Add compatibility mapping for existing seeded legacy roles.
- Split admin-web navigation into Global Studio, Tenant Builder, and Tenant Owner Portal surfaces.
- Add route/API guards for each surface.
- Ensure tenant owner cannot access builder controls by default.
- Ensure tenant admin cannot access global studio by default.
- Move operational pages into owner/ops navigation.
- Keep builder pages under tenant builder navigation.
- Add tests for route access and navigation visibility by role.
- Audit tenant isolation across all tenant-scoped APIs and worker flows.
- Add cross-tenant denial tests for each module.

## P1 Backlog — Global Studio and Templates

- Add Global Studio tenant inventory.
- Add create/archive/delete tenant workflows.
- Add tenant creation from template.
- Define versioned file-based template format and materialization service.
- Add promote-demo-to-template workflow.
- Add global theme inventory and editor.
- Validate themes as white-label visual tokens only.
- Add audit logs for tenant lifecycle operations.

## P2 Backlog — Owner Portal

- Add owner dashboard shell.
- Add bookings owner view.
- Add quote requests owner view.
- Add calendar/open days settings.
- Add owner/staff/provider permission matrix.
- Add module-aware owner navigation.
- Add owner-facing exports/reports.

## P3 Backlog — Builder and Demo/Template Robustness

- Formalize snapshot adapters for module-owned demo/template state outside `tenant_modules`.
- Define versioned tenant webapp export package schema.
- Implement tenant export dry-run/import service.
- Add module export/import migrator registry.
- Add old export fixtures to compatibility tests.
- Add asset handling rules for templates.
- Add reset-demo-to-baseline and export/import snapshot commands.
- Add visual template previews.
- Add stronger module page locking in builder inventory.

## P4 Backlog — Persistence and Disaster Recovery

- Add local backup script for Postgres and uploaded assets.
- Add local restore script and staging restore drill docs.
- Implement initial RPO/RTO target: 24h data loss maximum, 4–8h manual restore window.
- Add production backup retention/encryption requirements.
- Add monitoring requirements for failed backup jobs.
- Add single-tenant restore feasibility analysis.

## Future Backlog

- Stripe deposits.
- Calendar sync adapter.
- SMS notifications.
- CSV import/export.
- Custom domain verification.
- Advanced page editor.
- Analytics dashboard.
- Waitlist.
- Reseller mode.
- Self-hosted packaging.
- Schema-per-tenant option.
- Advanced workflow automation.
- Loyalty/memberships module.
- Reviews module.
- Inventory module.

---
