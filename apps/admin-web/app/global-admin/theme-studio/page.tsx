import React from 'react';
import { redirect } from 'next/navigation';
import { createAuditLogService } from '@margo/db';
import { ShellCard } from '@margo/ui';
import { themePresets } from '@margo/themes';
import { themePreviewFixtures } from '@margo/design';
import { SurfaceShell } from '../../surface-shell';
import { isSurfaceAllowed } from '../../admin-context';
import {
  buildThemeFontOptions,
  lifecycleOptions,
  readThemeOverrides,
} from './theme-studio-schema';
import {
  createThemeStudioFamily,
  deleteThemeStudioFamily,
  listThemeStudioFamilies,
  transitionThemeStudioFamily,
  updateThemeStudioDraft,
  type ThemeStudioFamilyView,
} from './theme-studio-store';
import { getCurrentDevSession } from '../../session';
import { ThemeStudioEditor } from './theme-studio-editor';

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
  redirect(`/global-admin/theme-studio?theme=${family.id}`);
}

async function saveThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const family = updateThemeStudioDraft(
    {
      familyId: String(formData.get('familyId') ?? ''),
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      overrides: readThemeOverrides(formData),
    },
  );
  await recordThemeStudioAuditLog('theme.family.update', session.userId, { familyId: family.id, lifecycle: family.lifecycle, builtIn: family.isBuiltIn });
  redirect(`/global-admin/theme-studio?theme=${family.id}`);
}

async function transitionThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const lifecycle = String(formData.get('lifecycle') ?? 'draft') as (typeof lifecycleOptions)[number];
  const family = transitionThemeStudioFamily({ familyId: String(formData.get('familyId') ?? ''), lifecycle });
  await recordThemeStudioAuditLog(`theme.family.${lifecycle}`, session.userId, { familyId: family.id, lifecycle: family.lifecycle });
  redirect(`/global-admin/theme-studio?theme=${family.id}`);
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

export default async function ThemeStudioPage({ searchParams }: { searchParams?: Promise<{ theme?: string }> }) {
  const params = await searchParams;
  const families = listThemeStudioFamilies();
  const selectedFamily = resolveSelectedFamily(families, params?.theme);
  const themeFontOptions = buildThemeFontOptions();

  return (
    <SurfaceShell surface="global-admin">
      <div className="admin-stack">
        <ShellCard eyebrow="Global Admin" title="Theme Studio">
          <p>Build reusable themes, tweak every token layer, and publish only after design gates pass.</p>
          <p className="form-help">Built-in themes are editable too; saves are stored locally as overrides.</p>
          <div className="admin-action-row theme-studio-hero-actions">
            <form action={createThemeFamilyAction} className="theme-studio-create-form">
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
              <label>
                Description
                <input name="description" defaultValue="" />
              </label>
              <button type="submit" className="button-link">Create draft family</button>
            </form>
          </div>
        </ShellCard>

        <div className="theme-studio-layout">
          <ShellCard eyebrow="Theme families" title="Inventory">
            <div className="theme-studio-family-list">
              {families.map((family) => (
                <article key={family.id} className={`theme-studio-family-card ${family.id === selectedFamily?.id ? 'theme-studio-family-card--selected' : ''}`}>
                  <div>
                    <p className="section-kicker">{family.isBuiltIn ? 'Built-in' : 'Custom'}</p>
                    <h3>{family.name}</h3>
                    <p className="form-help">{family.description ?? 'Reusable theme family.'}</p>
                    <div className="theme-studio-family-meta">
                      <span>{family.sourcePresetId}</span>
                      <span>{family.lifecycle}</span>
                      <span>{family.canPublish ? 'Ready' : 'Blocked'}</span>
                    </div>
                  </div>
                  <div className="theme-studio-family-actions">
                    <a className="button-link" href={`/global-admin/theme-studio?theme=${family.id}`}>Edit theme</a>
                    <span className={`status-pill ${family.canPublish ? 'status-ready' : 'status-warning'}`}>{family.canPublish ? 'Publish ready' : 'Needs review'}</span>
                  </div>
                </article>
              ))}
            </div>
          </ShellCard>

          {selectedFamily ? (
            <ThemeStudioEditor family={selectedFamily} themeFontOptions={themeFontOptions} saveAction={saveThemeFamilyAction} />
          ) : null}

          {selectedFamily ? (
            <ShellCard eyebrow="Theme operations" title={selectedFamily.name}>
              <div className="admin-stack">
                <form action={transitionThemeFamilyAction} className="editor-form theme-studio-compact-form">
                  <input type="hidden" name="familyId" value={selectedFamily.id} />
                  <label>
                    Lifecycle
                    <select name="lifecycle" defaultValue={selectedFamily.lifecycle}>
                      {lifecycleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <div className="page-editor-actions">
                    <button type="submit" className="button-link">Update lifecycle</button>
                  </div>
                </form>
                {!selectedFamily.isBuiltIn && selectedFamily.canDelete ? (
                  <form action={deleteThemeFamilyAction}>
                    <input type="hidden" name="familyId" value={selectedFamily.id} />
                    <button type="submit" className="button-link button-link-danger">Delete theme</button>
                  </form>
                ) : (
                  <p className="form-help">Built-in themes cannot be deleted, but their overrides can be saved locally.</p>
                )}
              </div>
            </ShellCard>
          ) : null}
        </div>

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
      </div>
    </SurfaceShell>
  );
}

function resolveSelectedFamily(families: ThemeStudioFamilyView[], requestedId?: string) {
  return families.find((family) => family.id === requestedId) ?? families[0] ?? null;
}
