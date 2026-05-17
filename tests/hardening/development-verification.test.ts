import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('development verification checklist', () => {
  it('documents the required completion gates', () => {
    const doc = read('docs/24-development-verification-checklist.md');

    expect(doc).toContain('Clean restart');
    expect(doc).toContain('Core checks');
    expect(doc).toContain('Route smoke checks');
    expect(doc).toContain('Hydration/runnable check');
    expect(doc).toContain('tenant-specific preview/public theme resolution');
    expect(doc).toContain('http://localhost:3000/t/chef');
    expect(doc).toContain('http://localhost:3001/global-admin/theme-studio');
    expect(doc).toContain('A change is only done');
  });

  it('keeps the local stack startup cache-clean before app launch', () => {
    const start = read('scripts/start.sh');

    expect(start).toContain('clearing app build caches');
    expect(start).toContain('apps/public-web/.next');
    expect(start).toContain('apps/admin-web/.next');
    expect(start).toContain('apps/api/.next');
  });
});
