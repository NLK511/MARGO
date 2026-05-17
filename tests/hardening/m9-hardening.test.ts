import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const docs = [
  'docs/design-system.md',
  'docs/theme-recipes.md',
  'docs/design-validators.md',
  'docs/theme-migration.md',
  'docs/theme-studio-operator-guide.md',
];

describe('m9 hardening', () => {
  it('ships the developer and operator docs', () => {
    for (const doc of docs) {
      expect(existsSync(join(process.cwd(), doc))).toBe(true);
      expect(readFileSync(join(process.cwd(), doc), 'utf8')).toMatch(/^# /m);
    }
  });

  it('keeps public-web source free from admin imports', () => {
    execFileSync('node', [join(process.cwd(), 'scripts/check-public-bundle.mjs')], { stdio: 'pipe' });
    expect(true).toBe(true);
  });
});
