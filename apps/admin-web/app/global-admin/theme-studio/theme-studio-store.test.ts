import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createThemeStudioFamily, getThemeStudioFamily, listThemeStudioFamilies, transitionThemeStudioFamily, updateThemeStudioDraft, writeThemeStudioState } from './theme-studio-store';

describe('theme studio store', () => {
  it('creates, updates, and publishes theme families in local state', () => {
    const root = mkdtempSync(join(tmpdir(), 'margo-theme-studio-'));
    const statePath = join(root, 'theme-studio-state.json');

    const created = createThemeStudioFamily({ name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining' }, { statePath });
    expect(created.lifecycle).toBe('draft');

    const updated = updateThemeStudioDraft({ familyId: created.id, description: 'Editorial luxury' }, { statePath });
    expect(updated.description).toBe('Editorial luxury');

    const published = transitionThemeStudioFamily({ familyId: created.id, lifecycle: 'published' }, { statePath });
    expect(published.lifecycle).toBe('published');

    const stored = getThemeStudioFamily({ familyId: created.id }, { statePath });
    expect(stored?.lifecycle).toBe('published');

    rmSync(root, { recursive: true, force: true });
  });

  it('lists built-in families and stored custom drafts', () => {
    const root = mkdtempSync(join(tmpdir(), 'margo-theme-studio-'));
    const statePath = join(root, 'theme-studio-state.json');
    writeThemeStudioState({ families: {} }, { statePath });
    createThemeStudioFamily({ name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining' }, { statePath });

    const families = listThemeStudioFamilies({ statePath });
    expect(families.some((family) => family.id === 'clinical-calm' && family.isBuiltIn)).toBe(true);
    expect(families.some((family) => family.name === 'Studio Noir')).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });

  it('blocks publishing invalid theme families', () => {
    const root = mkdtempSync(join(tmpdir(), 'margo-theme-studio-'));
    const statePath = join(root, 'theme-studio-state.json');
    const created = createThemeStudioFamily({ name: 'Invalid Noir', sourcePresetId: 'luxury-dark-dining', overrides: { colors: { bg: 'blue' } } }, { statePath });

    expect(() => transitionThemeStudioFamily({ familyId: created.id, lifecycle: 'published' }, { statePath })).toThrow(/6-digit hex value/i);

    rmSync(root, { recursive: true, force: true });
  });
});
