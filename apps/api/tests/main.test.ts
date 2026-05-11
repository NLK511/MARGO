import { describe, expect, it } from 'vitest';
import { getApiStatus, searchPublicAvailability } from '../src/main';

describe('api bootstrap', () => {
  it('reports ready status', () => {
    expect(getApiStatus()).toMatchObject({ service: 'margo-api', status: 'ready' });
  });

  it('exposes public availability search', () => {
    const result = searchPublicAvailability({
      service: { id: 'service', durationMinutes: 30 },
      resources: [{ id: 'resource', active: true, capacity: 2 }],
      bookings: [],
      date: '2026-05-11',
      businessHours: { opensAt: '09:00', closesAt: '10:00' },
    });

    expect(result.slots).toHaveLength(2);
  });
});
