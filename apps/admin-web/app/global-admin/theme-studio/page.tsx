import React from 'react';
import { ShellCard } from '@margo/ui';
import { themePresets } from '@margo/themes';
import { themePreviewFixtures } from '@margo/design';
import { SurfaceShell } from '../../surface-shell';
import { listThemeStudioFamilies } from './theme-studio-store';

const lifecycleOptions = ['draft', 'qa', 'published', 'deprecated', 'archived'] as const;

export default async function ThemeStudioPage() {
  const families = listThemeStudioFamilies();

  return (
    <SurfaceShell surface="global-admin">
      <ShellCard eyebrow="Global Admin" title="Theme Studio">
        <p>Create theme families from approved presets, edit draft versions, and publish only after design gates pass.</p>
        <div className="admin-action-row">
          <form action="/global-admin/theme-studio/api" method="post">
            <input type="hidden" name="action" value="create-family" />
            <label>
              Start from preset
              <select name="sourcePresetId" defaultValue={themePresets[0]?.id}>
                {themePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label>
              Theme name
              <input name="name" defaultValue="New theme family" />
            </label>
            <button type="submit" className="button-link">Create draft family</button>
          </form>
        </div>
      </ShellCard>

      <ShellCard eyebrow="Token selectors" title="Curated controls">
        <div className="admin-grid two-columns">
          <label>
            Lifecycle
            <select name="lifecycle" defaultValue="draft">
              {lifecycleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            Preview fixture
            <select name="fixture" defaultValue={themePreviewFixtures[0]?.id}>
              {themePreviewFixtures.map((fixture) => <option key={fixture.id} value={fixture.id}>{fixture.title}</option>)}
            </select>
          </label>
        </div>
        <p className="form-help">No raw color, spacing, or font inputs are exposed here; only approved theme tokens and lifecycle choices.</p>
      </ShellCard>

      <ShellCard eyebrow="Theme families" title="Inventory and draft controls">
        <div className="admin-table" role="table" aria-label="Theme families">
          <div className="admin-table-row admin-table-head" role="row">
            <span>Name</span>
            <span>Source preset</span>
            <span>Lifecycle</span>
            <span>Publish gate</span>
          </div>
          {families.map((family) => (
            <div key={family.id} className="admin-table-row" role="row">
              <span>{family.name}{family.isBuiltIn ? ' (built-in)' : ''}</span>
              <span>{family.sourcePresetId}</span>
              <span>{family.lifecycle}</span>
              <span>{family.canPublish ? 'Ready' : 'Blocked'}</span>
            </div>
          ))}
        </div>

        <div className="admin-stack">
          {families.filter((family) => !family.isBuiltIn).map((family) => (
            <form key={family.id} action="/global-admin/theme-studio/api" method="post">
              <input type="hidden" name="action" value="update-draft" />
              <input type="hidden" name="familyId" value={family.id} />
              <label>
                Draft name
                <input name="name" defaultValue={family.name} />
              </label>
              <label>
                Description
                <textarea name="description" defaultValue={family.description ?? ''} />
              </label>
              <div className="admin-action-row">
                <button type="submit" className="button-link">Save draft</button>
              </div>
            </form>
          ))}
          {families.filter((family) => !family.isBuiltIn).map((family) => (
            <form key={`${family.id}-publish`} action="/global-admin/theme-studio/api" method="post">
              <input type="hidden" name="action" value="transition" />
              <input type="hidden" name="familyId" value={family.id} />
              <label>
                Lifecycle
                <select name="lifecycle" defaultValue={family.lifecycle}>
                  {lifecycleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <div className="admin-action-row">
                <button type="submit" className="button-link">Update lifecycle</button>
              </div>
            </form>
          ))}
        </div>
      </ShellCard>

      <ShellCard eyebrow="Preview matrix" title="Theme preview fixtures">
        <div className="theme-preview-matrix">
          {themePreviewFixtures.map((fixture) => (
            <article key={fixture.id} className="theme-preview-card">
              <p className="eyebrow">{fixture.id}</p>
              <h2>{fixture.title}</h2>
              <p>{fixture.description}</p>
            </article>
          ))}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
