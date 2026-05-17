import React from 'react';
import { redirect } from 'next/navigation';
import { createAuditLogService } from '@margo/db';
import { ShellCard } from '@margo/ui';
import { themePresets } from '@margo/themes';
import { themePreviewFixtures } from '@margo/design';
import { SurfaceShell } from '../../surface-shell';
import { isSurfaceAllowed } from '../../admin-context';
import {
  createThemeStudioFamily,
  deleteThemeStudioFamily,
  listThemeStudioFamilies,
  transitionThemeStudioFamily,
  updateThemeStudioDraft,
  type ThemeStudioFamilyView,
} from './theme-studio-store';
import { getCurrentDevSession } from '../../session';

const lifecycleOptions = ['draft', 'qa', 'published', 'deprecated', 'archived'] as const;
const colorFields = [
  ['bg', 'Background'],
  ['surface', 'Surface'],
  ['surfaceAlt', 'Surface alt'],
  ['text', 'Text'],
  ['textMuted', 'Text muted'],
  ['border', 'Border'],
  ['primary', 'Primary'],
  ['primaryContrast', 'Primary contrast'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['success', 'Success'],
  ['warning', 'Warning'],
  ['danger', 'Danger'],
] as const;
const typographyFields = [
  ['fontSans', 'Sans font'],
  ['fontSerif', 'Serif font'],
  ['fontDisplay', 'Display font'],
  ['fontH1', 'H1 font'],
  ['fontH2', 'H2 font'],
  ['fontH3', 'H3 font'],
  ['fontBody', 'Body font'],
  ['fontParagraph', 'Paragraph font'],
] as const;
const typographyColorFields = [
  ['fontSansColor', 'Sans color'],
  ['fontDisplayColor', 'Display color'],
  ['fontH1Color', 'H1 color'],
  ['fontH2Color', 'H2 color'],
  ['fontH3Color', 'H3 color'],
  ['fontBodyColor', 'Body color'],
  ['fontParagraphColor', 'Paragraph color'],
] as const;
const layoutFields = [
  ['template', 'Template', ['classic', 'editorial', 'split', 'immersive'] as const],
  ['nav', 'Navigation', ['top', 'centered', 'minimal', 'overlay'] as const],
  ['hero', 'Hero', ['split-image', 'full-bleed', 'card-stack', 'brutalist'] as const],
  ['contentWidth', 'Content width', ['centered', 'wide', 'full'] as const],
  ['sectionRhythm', 'Section rhythm', ['none', 'compact', 'spacious'] as const],
  ['sectionBorder', 'Section border', ['thin', 'thick', 'none'] as const],
  ['cardStyle', 'Card style', ['soft-shadow', 'flat', 'brutalist', 'glass'] as const],
  ['cardRadius', 'Card radius', ['round', 'square'] as const],
] as const;
const spacingFields = [
  ['pagePadding', 'Page padding'],
  ['sectionGap', 'Section gap'],
  ['cardPadding', 'Card padding'],
  ['heroPadding', 'Hero padding'],
  ['navGap', 'Navigation gap'],
  ['contentGap', 'Content gap'],
  ['blockGap', 'Block gap'],
] as const;
const assetFields = [
  ['backgroundImageUrl', 'Background image URL'],
  ['cardBackgroundImageUrl', 'Card background image URL'],
  ['heroBackgroundImageUrl', 'Hero background image URL'],
] as const;
const themeFontOptions = Array.from(new Set(themePresets.flatMap((preset) => collectPresetFonts(preset))));

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

async function saveThemeFamilyAction(formData: FormData) {
  'use server';
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) redirect('/login');
  const family = updateThemeStudioDraft(
    {
      familyId: String(formData.get('familyId') ?? ''),
      name: stringValue(formData.get('name')),
      description: stringValue(formData.get('description')),
      overrides: readThemeOverrides(formData),
    },
  );
  await recordThemeStudioAuditLog('theme.family.update', session.userId, { familyId: family.id, lifecycle: family.lifecycle, builtIn: family.isBuiltIn });
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
        <p>Create theme families, tweak every token layer, and publish only after design gates pass.</p>
        <p className="form-help">Built-in themes are now editable too; saves are stored as local overrides.</p>
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
            <label>
              Description
              <input name="description" defaultValue="" />
            </label>
            <button type="submit" className="button-link">Create draft family</button>
          </form>
        </div>
      </ShellCard>

      <ShellCard eyebrow="Theme families" title="Inventory and editor">
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
          {families.map((family) => renderThemeFamilyEditor(family))}
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

function renderThemeFamilyEditor(family: ThemeStudioFamilyView) {
  const theme = family.theme;
  return (
    <ShellCard key={family.id} eyebrow={family.isBuiltIn ? 'Built-in theme' : 'Custom theme'} title={family.name}>
      <p>{family.description ?? 'Reusable global theme.'}</p>
      <p className="form-help">Source preset: {family.sourcePresetId} · Lifecycle: {family.lifecycle}</p>

      <form action={saveThemeFamilyAction} className="editor-form theme-editor-form">
        <input type="hidden" name="familyId" value={family.id} />

        <label>
          Theme name
          <input name="name" defaultValue={family.name} />
        </label>
        <label>
          Description
          <input name="description" defaultValue={family.description ?? ''} />
        </label>

        <fieldset>
          <legend>Color palette</legend>
          <div className="admin-grid two-columns">
            {colorFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`colors.${key}`} defaultValue={theme.colors[key]} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Typography</legend>
          <div className="admin-grid two-columns">
            {typographyFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`typography.${key}`} defaultValue={stringThemeValue(theme.typography[key])} list="theme-fonts" />
              </label>
            ))}
            <label>
              Heading weight
              <input name="typography.headingWeight" type="number" min={100} max={900} step={100} defaultValue={theme.typography.headingWeight} />
            </label>
            <label>
              Body weight
              <input name="typography.bodyWeight" type="number" min={100} max={900} step={100} defaultValue={theme.typography.bodyWeight} />
            </label>
            <label>
              Scale
              <select name="typography.scale" defaultValue={theme.typography.scale}>
                <option value="standard">standard</option>
                <option value="editorial">editorial</option>
                <option value="bold">bold</option>
              </select>
            </label>
          </div>
          <div className="admin-grid two-columns">
            {typographyColorFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`typography.${key}`} defaultValue={stringThemeValue(theme.typography[key])} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Layout</legend>
          <div className="admin-grid two-columns">
            {layoutFields.map(([key, label, options]) => (
              <label key={key}>
                {label}
                <select name={`layout.${key}`} defaultValue={String(theme.layout[key])}>
                  {options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <label>
              Sticky nav
              <select name="layout.navSticky" defaultValue={theme.layout.navSticky ? 'true' : 'false'}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Spacing and sizes</legend>
          <div className="admin-grid two-columns">
            {spacingFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`spacing.${key}`} defaultValue={stringThemeValue(theme.spacing?.[key])} placeholder="24px" />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Assets</legend>
          <div className="admin-grid two-columns">
            {assetFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`assets.${key}`} defaultValue={stringThemeValue(theme.assets?.[key])} placeholder="https://..." />
              </label>
            ))}
          </div>
        </fieldset>

        <datalist id="theme-fonts">
          {themeFontOptions.map((font) => <option key={font} value={font} />)}
        </datalist>

        <div className="page-editor-actions">
          <button type="submit" className="button-link">{family.isBuiltIn ? 'Save theme' : 'Save theme draft'}</button>
        </div>
      </form>

      {!family.isBuiltIn ? (
        <div className="admin-stack">
          <form action={transitionThemeFamilyAction} className="editor-form">
            <input type="hidden" name="familyId" value={family.id} />
            <label>
              Lifecycle
              <select name="lifecycle" defaultValue={family.lifecycle}>
                {lifecycleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <div className="page-editor-actions">
              <button type="submit" className="button-link">Update lifecycle</button>
            </div>
          </form>
          {family.canDelete ? (
            <form action={deleteThemeFamilyAction}>
              <input type="hidden" name="familyId" value={family.id} />
              <button type="submit" className="button-link button-link-danger">Delete theme</button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="form-help">Built-in themes cannot be deleted, but their tokens are saved locally as overrides.</p>
      )}
    </ShellCard>
  );
}

function readThemeOverrides(formData: FormData) {
  return {
    colors: compactObject(readSection(formData, 'colors.', colorFields.map(([key]) => key))),
    typography: compactObject(readThemeTypography(formData)),
    layout: compactObject({
      ...readSection(formData, 'layout.', layoutFields.map(([key]) => key)),
      navSticky: booleanValue(formData.get('layout.navSticky')),
    }),
    assets: compactObject(readSection(formData, 'assets.', assetFields.map(([key]) => key))),
    spacing: compactObject(readSection(formData, 'spacing.', spacingFields.map(([key]) => key))),
  };
}

function readThemeTypography(formData: FormData) {
  return {
    ...readSection(formData, 'typography.', typographyFields.map(([key]) => key)),
    headingWeight: numberValue(formData.get('typography.headingWeight')),
    bodyWeight: numberValue(formData.get('typography.bodyWeight')),
  };
}

function readSection(formData: FormData, prefix: string, keys: readonly string[]) {
  return keys.reduce<Record<string, string>>((acc, key) => {
    const value = stringValue(formData.get(`${prefix}${key}`));
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});
}

function stringValue(value: FormDataEntryValue | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function collectPresetFonts(preset: (typeof themePresets)[number]): string[] {
  const typography = preset.typography as {
    fontSans: string;
    fontSerif?: string;
    fontDisplay: string;
    fontH1?: string;
    fontH2?: string;
    fontH3?: string;
    fontBody?: string;
    fontParagraph?: string;
  };
  return [typography.fontSans, typography.fontSerif, typography.fontDisplay, typography.fontH1, typography.fontH2, typography.fontH3, typography.fontBody, typography.fontParagraph].filter((value): value is string => Boolean(value));
}

function stringThemeValue(value: string | number | undefined): string {
  return value === undefined ? '' : String(value);
}

function booleanValue(value: FormDataEntryValue | null | undefined): boolean | undefined {
  const string = stringValue(value);
  if (string === undefined) return undefined;
  return string === 'true';
}

function numberValue(value: FormDataEntryValue | null | undefined): number | undefined {
  const string = stringValue(value);
  if (string === undefined) return undefined;
  const parsed = Number(string);
  return Number.isFinite(parsed) ? parsed : undefined;
}
