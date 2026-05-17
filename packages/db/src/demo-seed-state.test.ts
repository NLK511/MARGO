import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { loadDemoSeedSnapshot, syncDemoTenantSeedSnapshot, writeDemoSeedSnapshot } from './demo-seed-state';

describe('demo seed snapshot', () => {
  it('writes and loads demo tenant snapshot data', () => {
    const snapshotPath = join(mkdtempSync(join(tmpdir(), 'margo-demo-snapshot-')), 'demo-seed-state.json');

    writeDemoSeedSnapshot(
      {
        tenants: {
          'maison-noire': {
            slug: 'maison-noire',
            branding: { themePresetId: 'luxury-dark-dining', logoUrl: '/logo.svg' },
            moduleSettings: [{ moduleId: 'quote-request', enabled: true, config: { title: 'Custom quote' } }],
            quoteRequest: { moduleId: 'quote-request', enabled: true, config: { title: 'Custom quote' } },
            pages: [
              {
                locale: 'en',
                slug: 'home',
                title: 'Maison Noire',
                seo: { title: 'Maison Noire' },
                status: 'published',
                layoutPreset: 'immersive',
                blocks: [{ type: 'hero', variant: 'split-image', props: { headline: 'Hello' }, position: 0 }],
              },
            ],
          },
        },
      },
      { snapshotPath },
    );

    const snapshot = loadDemoSeedSnapshot({ snapshotPath });
    expect(snapshot.tenants['maison-noire']?.branding?.themePresetId).toBe('luxury-dark-dining');
    expect(snapshot.tenants['maison-noire']?.moduleSettings?.[0]?.moduleId).toBe('quote-request');
    expect(snapshot.tenants['maison-noire']?.quoteRequest?.config?.title).toBe('Custom quote');
    expect(snapshot.tenants['maison-noire']?.pages?.[0]?.blocks[0]?.props).toEqual({ headline: 'Hello' });
  });

  it('captures the current tenant state from the database client', async () => {
    const snapshotPath = join(mkdtempSync(join(tmpdir(), 'margo-demo-snapshot-')), 'demo-seed-state.json');
    const client = {
      tenant: { findUnique: vi.fn(async () => ({ slug: 'maison-noire' })) },
      tenantBranding: { findUnique: vi.fn(async () => ({ themePresetId: 'custom', layoutConfig: { nav: 'overlay' }, themeOverrides: { colors: { primary: '#111' } }, logoUrl: '/logo.svg', faviconUrl: '/favicon.svg' })) },
      tenantModule: { findMany: vi.fn(async () => [{ moduleId: 'quote-request', enabled: true, config: { title: 'Custom quote' } }]) },
      publicPage: {
        findMany: vi.fn(async () => [
          {
            locale: 'en',
            slug: 'home',
            title: 'Maison Noire',
            seo: { title: 'Maison Noire' },
            status: 'published',
            layoutPreset: 'immersive',
            blocks: [{ type: 'hero', variant: 'split-image', props: { headline: 'Hello' }, position: 0 }],
          },
        ]),
      },
    };

    await syncDemoTenantSeedSnapshot(client as never, 'tenant-id', { snapshotPath });

    const snapshot = loadDemoSeedSnapshot({ snapshotPath });
    expect(snapshot.tenants['maison-noire']?.branding?.logoUrl).toBe('/logo.svg');
    expect(snapshot.tenants['maison-noire']?.moduleSettings?.[0]?.config?.title).toBe('Custom quote');
    expect(snapshot.tenants['maison-noire']?.quoteRequest?.config?.title).toBe('Custom quote');
    expect(snapshot.tenants['maison-noire']?.pages?.[0]?.slug).toBe('home');
  });
});
