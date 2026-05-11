import { calculateAvailability, createBookingService } from '@margo/db';
import type { AvailabilityServiceInput, PublicBookingInput } from '@margo/db';

export function getApiStatus() {
  return {
    service: 'margo-api',
    status: 'ready',
    routes: ['/api/v1/public/availability', '/api/v1/public/bookings', '/api/v1/admin/bookings'],
  } as const;
}

export function searchPublicAvailability(input: AvailabilityServiceInput) {
  return { slots: calculateAvailability(input) };
}

export function createPublicBooking(input: PublicBookingInput) {
  return createBookingService().createPublicBooking(input);
}

if (process.env.NODE_ENV !== 'test') {
  console.log(getApiStatus());
}
