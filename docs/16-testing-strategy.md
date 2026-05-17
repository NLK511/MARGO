## Test Layers

### Unit Tests

Cover:

- availability calculation
- booking status transitions
- RBAC checks
- theme token validation
- module dependency validation
- custom field validation

### Integration Tests

Cover:

- create booking transaction
- prevent double booking
- booking creates CRM timeline event
- payment webhook updates booking
- notification event queues job
- tenant isolation in queries
- cross-tenant access denial for every tenant-scoped module service
- tenant export/import round trips
- old export fixture migration to current model

### E2E Tests

Scenarios:

1. Frontpage-only tenant loads homepage.
2. Restaurant user books table/service.
3. Clinic patient books appointment.
4. Staff cancels booking.
5. Staff creates customer note.
6. Tenant owner changes theme preset.
7. Disabled module route returns 404/403.
8. Tenant owner cannot access tenant builder pages.
9. Tenant admin cannot access global studio pages.
10. Cross-tenant IDs are rejected from authenticated owner/admin flows.

### Accessibility Tests

- keyboard navigation
- focus states
- aria labels
- color contrast
- form errors
- modal focus trap

### Export/Import Compatibility Tests

- current tenant export imports into an equivalent tenant
- old-version export fixtures migrate successfully
- unknown safe fields are preserved or reported
- missing fields receive safe defaults
- module export/import adapters run independently
- dry-run import reports destructive changes before write

### Disaster Recovery Tests

- backup command succeeds in local/self-hosted mode
- restore command can recreate a usable database from a backup fixture
- uploaded asset references survive restore
- migration rollback/restore docs are exercised for risky releases

### Performance Tests

- homepage load
- availability search
- CRM customer search
- booking creation

---

