import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyEnvEntries, parseDotEnvContent, loadRepoEnvFile } from './index';

afterEach(() => {
  delete process.env.FOO;
  delete process.env.BAR;
  delete process.env.DATABASE_URL;
});

describe('dotenv bootstrap', () => {
  it('parses dotenv content with quoted and unquoted values', () => {
    expect(parseDotEnvContent('FOO=bar\nBAR="hello world"\nexport DATABASE_URL=postgres://example')).toEqual({
      FOO: 'bar',
      BAR: 'hello world',
      DATABASE_URL: 'postgres://example',
    });
  });

  it('applies env entries without overwriting existing variables', () => {
    process.env.FOO = 'keep-me';
    applyEnvEntries({ FOO: 'replacement', BAR: 'set-me' });
    expect(process.env.FOO).toBe('keep-me');
    expect(process.env.BAR).toBe('set-me');
  });

  it('loads a repo-local dotenv file when present', () => {
    const dir = mkdtempSync(join(tmpdir(), 'margo-db-env-'));
    const envPath = join(dir, '.env');
    writeFileSync(envPath, 'DATABASE_URL=postgresql://example.local/db\nFOO=bar\n');

    loadRepoEnvFile(envPath);

    expect(process.env.DATABASE_URL).toBe('postgresql://example.local/db');
    expect(process.env.FOO).toBe('bar');
    expect(readFileSync(envPath, 'utf8')).toContain('DATABASE_URL');
  });
});
