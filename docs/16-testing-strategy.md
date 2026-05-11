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

### E2E Tests

Scenarios:

1. Frontpage-only tenant loads homepage.
2. Restaurant user books table/service.
3. Clinic patient books appointment.
4. Staff cancels booking.
5. Staff creates customer note.
6. Tenant owner changes theme preset.
7. Disabled module route returns 404/403.

### Accessibility Tests

- keyboard navigation
- focus states
- aria labels
- color contrast
- form errors
- modal focus trap

### Performance Tests

- homepage load
- availability search
- CRM customer search
- booking creation

---

