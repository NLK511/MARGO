import React from 'react';
import { redirect } from 'next/navigation';
import { createAuditLogService } from '@margo/db';
import { ShellCard } from '@margo/ui';
import { themePresets } from '@margo/themes';
import { themePreviewFixtures } from '@margo/design';
import { SurfaceShell } from '../../surface-shell';
import { isSurfaceAllowed } from '../../admin-context';
import { createThemeStudioFamily, deleteThemeStudioFamily, listThemeStudioFamilies, transitionThemeStudioFamily, updateThemeStudioDraft } from './theme-studio-store';
import { getCurrentDevSession } from '../../session';

const lifecycleOptions = ['draft', 'qa', 'published', 'deprecated', 'archived'] as const;

async function recordThemeStudioAuditLog(action: string, actorUserId: string, metadata: Record<string, unknown>) {
  const auditLog = createAuditLogService();
  await auditLog.record({ tenantId: null, actorUserId: null, action, entityType: 'theme_family', entityId: null, metadata: { ...metadata, actorUserId } });
}

async function createThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const family = createThemeStudioFamily({
    name: String(formData.get('name') ?? 'New theme family'),
    sourcePresetId: String(formData.get('sourcePresetId') ?? 'clinical-calm'),
    description: String(formData.get('description') ?? '') || undefined,
  });
  await recordThemeStudioAuditLog('theme.family.create', session.userId, { familyId: family.id, sourcePresetId: family.sourcePresetId, lifecycle: family.lifecycle });
  redirect('/global-admin/theme-studio');
}

async function updateThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const family = updateThemeStudioDraft({
    familyId: String(formData.get('familyId') ?? ''),
    name: String(formData.get('name') ?? '') || undefined,
    description: String(formData.get('description') ?? '') || undefined,
  });
  await recordThemeStudioAuditLog('theme.family.update', session.userId, { familyId: family.id, lifecycle: family.lifecycle });
  redirect('/global-admin/theme-studio');
}

async function transitionThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const lifecycle = String(formData.get('lifecycle') ?? 'draft') as 'draft' | 'qa' | 'published' | 'deprecated' | 'archived';
  const family = transitionThemeStudioFamily({ familyId: String(formData.get('familyId') ?? ''), lifecycle });
  await recordThemeStudioAuditLog(`theme.family.${lifecycle}`, session.userId, { familyId: family.id, lifecycle: family.lifecycle });
  redirect('/global-admin/theme-studio');
}

async function deleteThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const familyId = String(formData.get('familyId') ?? '');
  deleteThemeStudioFamily({ familyId });
  await recordThemeStudioAuditLog('theme.family.delete', session.userId, { familyId });
  redirect('/global-admin/theme-studio');
}

export default async function ThemeStudioPage() {
  const families = listThemeStudioFamilies();

  return (
    <SurfaceShell surface="global-admin">
      <ShellCard eyebrow="Global Admin" title="Theme Studio">
        <p>Create theme families from approved presets, edit draft versions, and publish only after design gates pass.</p>
        <div className="admin-action-row">
          <form action={createThemeFamilyAction}>
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
            <form key={family.id} action={updateThemeFamilyAction}>
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
            <React.Fragment key={`${family.id}-lifecycle`}>
              <form action={transitionThemeFamilyAction}>
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
              <form action={deleteThemeFamilyAction}>
                <input type="hidden" name="familyId" value={family.id} />
                <div className="admin-action-row">
                  <button type="submit" className="button-link button-link-danger">Delete theme</button>
                </div>
              </form>
            </React.Fragment>
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
