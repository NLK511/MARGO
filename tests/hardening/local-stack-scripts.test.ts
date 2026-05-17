import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('local stack scripts', () => {
  it('do not fall back to sudo docker', () => {
    const start = read('scripts/start.sh');
    const stop = read('scripts/stop.sh');
    const deploy = read('scripts/deploy.sh');

    expect(start).not.toContain('sudo docker compose');
    expect(stop).not.toContain('sudo docker compose');
    expect(deploy).not.toContain('sudo docker');
    expect(start).toContain('docker daemon is not available for the local stack');
    expect(stop).toContain('docker daemon is not available to stop the local stack');
  });

  it('keeps the worker container bootstrapped through the worker package entrypoint', () => {
    const dockerfile = read('infra/Dockerfile.worker');
    expect(dockerfile).toContain('pnpm --filter @margo/db db:generate');
    expect(dockerfile).toContain('pnpm --filter @margo/worker dev');
  });
});
