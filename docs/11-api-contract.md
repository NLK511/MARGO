## API Principles

- REST first.
- JSON request/response.
- Version all endpoints under `/api/v1`.
- Public endpoints resolve tenant by hostname or explicit tenant slug.
- Admin endpoints require auth and RBAC.
- Use idempotency keys for booking/payment operations.

## Public API

```yaml
openapi: 3.1.0
info:
  title: White Label SMB Platform API
  version: 1.0.0
paths:
  /api/v1/public/site/pages/{slug}:
    get:
      summary: Get public page model
      parameters:
        - name: slug
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Page model

  /api/v1/public/booking/availability/search:
    post:
      summary: Search available booking slots
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [serviceId, dateFrom, dateTo]
              properties:
                tenantSlug: { type: string }
                locationId: { type: string }
                serviceId: { type: string }
                preferredResourceId: { type: string, nullable: true }
                dateFrom: { type: string, format: date }
                dateTo: { type: string, format: date }
                partySize: { type: integer, default: 1 }
      responses:
        '200':
          description: Available slots

  /api/v1/public/bookings:
    post:
      summary: Create public booking
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema: { type: string }
      responses:
        '201':
          description: Booking created
```

## Admin API Inventory

```txt
GET    /api/v1/admin/me
GET    /api/v1/admin/tenant
PATCH  /api/v1/admin/tenant
GET    /api/v1/admin/modules
PATCH  /api/v1/admin/modules/:moduleId
GET    /api/v1/admin/site/pages
POST   /api/v1/admin/site/pages
PATCH  /api/v1/admin/site/pages/:id
POST   /api/v1/admin/site/pages/:id/publish
GET    /api/v1/admin/bookings
POST   /api/v1/admin/bookings
PATCH  /api/v1/admin/bookings/:id
GET    /api/v1/admin/customers
POST   /api/v1/admin/customers
GET    /api/v1/admin/customers/:id
PATCH  /api/v1/admin/customers/:id
GET    /api/v1/admin/reports/overview
```

## Error Format

```json
{
  "error": {
    "code": "BOOKING_SLOT_UNAVAILABLE",
    "message": "The selected slot is no longer available.",
    "details": {},
    "requestId": "req_123"
  }
}
```

---

