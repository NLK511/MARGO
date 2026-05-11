import { describe, expect, it } from 'vitest';
import { getApiStatus } from '../src/main';

describe('api bootstrap', () => {
  it('reports ready status', () => {
    expect(getApiStatus()).toEqual({ service: 'margo-api', status: 'ready' });
  });
});
