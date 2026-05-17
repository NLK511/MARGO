import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createThemeStudioFamily, deleteThemeStudioFamily, getThemeStudioFamily, listThemeStudioFamilies, transitionThemeStudioFamily, updateThemeStudioDraft, writeThemeStudioState } from './theme-studio-store';

describe('theme studio store', () => {
  it('creates, updates, and publishes theme families in local state', () => {
    const root = mkdtempSync(join(tmpdir(), 'margo-theme-studio-'));
    const statePath = join(root, 'theme-studio-state.json');

    const created = createThemeStudioFamily({ name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining' }, { statePath });
    expect(created.lifecycle).toBe('draft');

    const updated = updateThemeStudioDraft({ familyId: created.id, description: 'Editorial luxury' }, { statePath });
    expect(updated.description).toBe('Editorial luxury');

    const builtIn = updateThemeStudioDraft({ familyId: 'chef', name: 'Chef Signature', overrides: { spacing: { pagePadding: '32px' } } }, { statePath });
    expect(builtIn.isBuiltIn).toBe(true);
    expect(builtIn.name).toBe('Chef Signature');
    expect(builtIn.theme.spacing?.pagePadding).toBe('32px');

    const published = transitionThemeStudioFamily({ familyId: created.id, lifecycle: 'published' }, { statePath });
    expect(published.lifecycle).toBe('published');

    expect(() => deleteThemeStudioFamily({ familyId: created.id }, { statePath })).toThrow(/cannot be deleted/i);
    expect(() => deleteThemeStudioFamily({ familyId: 'chef' }, { statePath })).toThrow(/built-in theme families cannot be deleted/i);

    const stored = getThemeStudioFamily({ familyId: created.id }, { statePath });
    expect(stored?.lifecycle).toBe('published');

    rmSync(root, { recursive: true, force: true });
  });

  it('deletes draft theme families from local state', () => {
    const root = mkdtempSync(join(tmpdir(), 'margo-theme-studio-'));
    const statePath = join(root, 'theme-studio-state.json');

    const created = createThemeStudioFamily({ name: 'Studio Noir', sourcePresetId: 'luxury-dark-dining' }, { statePath });
    deleteThemeStudioFamily({ familyId: created.id }, { statePath });

    expect(getThemeStudioFamily({ familyId: created.id }, { statePath })).toBeNull();

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
