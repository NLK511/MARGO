import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getThemePreset, mergeTheme, themePresets, type ThemeOverrides, type ThemePreset } from '@margo/themes';
import { evaluateThemePublishGate } from '@margo/themes';
import type { ThemeLifecycle } from '@margo/themes';

export interface ThemeStudioState {
  families: Record<string, ThemeStudioFamilyRecord>;
}

export interface ThemeStudioFamilyRecord {
  id: string;
  name: string;
  description?: string;
  sourcePresetId: string;
  overrides: ThemeOverrides;
  lifecycle: ThemeLifecycle;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeStudioFamilyView {
  id: string;
  name: string;
  description?: string;
  sourcePresetId: string;
  lifecycle: ThemeLifecycle;
  isBuiltIn: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  issues: Array<{ code: string; severity: 'info' | 'warning' | 'error'; message: string; path: string; suggestedFix?: string }>;
  theme: ThemePreset;
}

export class ThemeStudioError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ThemeStudioError';
  }
}

export interface ThemeStudioStateOptions {
  statePath?: string;
  startDir?: string;
}

export interface CreateThemeStudioFamilyInput {
  name: string;
  sourcePresetId: string;
  description?: string;
  overrides?: ThemeOverrides;
}

export interface UpdateThemeStudioDraftInput {
  familyId: string;
  name?: string;
  description?: string;
  overrides?: ThemeOverrides;
}

export interface TransitionThemeStudioFamilyInput {
  familyId: string;
  lifecycle: ThemeLifecycle;
}

export interface DeleteThemeStudioFamilyInput {
  familyId: string;
}

export function loadThemeStudioState(options: ThemeStudioStateOptions = {}): ThemeStudioState {
  const statePath = options.statePath ?? resolveThemeStudioStatePath(options.startDir ?? process.cwd());
  if (!existsSync(statePath)) return { families: {} };

  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8')) as unknown;
    return { families: isPlainObject(raw) && isPlainObject(raw.families) ? (raw.families as Record<string, ThemeStudioFamilyRecord>) : {} };
  } catch {
    return { families: {} };
  }
}

export function writeThemeStudioState(state: ThemeStudioState, options: ThemeStudioStateOptions = {}): void {
  const statePath = options.statePath ?? resolveThemeStudioStatePath(options.startDir ?? process.cwd());
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

export function resolveThemeStudioStatePath(startDir = process.cwd()): string {
  return resolve(resolveRepoRoot(startDir), '.margo', 'theme-studio-state.json');
}

export function listThemeStudioFamilies(options: ThemeStudioStateOptions = {}): ThemeStudioFamilyView[] {
  const state = loadThemeStudioState(options);
  const customFamilies = Object.values(state.families).filter((family) => !isBuiltInThemeId(family.id)).map((family) => viewFromRecord(family));
  return [...themePresets.map((preset) => viewFromPreset(preset, state.families[preset.id])), ...customFamilies];
}

export function createThemeStudioFamily(input: CreateThemeStudioFamilyInput, options: ThemeStudioStateOptions = {}): ThemeStudioFamilyView {
  const state = loadThemeStudioState(options);
  const id = uniqueFamilyId(slugify(input.name || input.sourcePresetId), state);
  const record: ThemeStudioFamilyRecord = {
    id,
    name: input.name.trim(),
    description: input.description?.trim(),
    sourcePresetId: input.sourcePresetId,
    overrides: input.overrides ?? {},
    lifecycle: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.families[id] = record;
  writeThemeStudioState(state, options);
  return viewFromRecord(record);
}

export function updateThemeStudioDraft(input: UpdateThemeStudioDraftInput, options: ThemeStudioStateOptions = {}): ThemeStudioFamilyView {
  const state = loadThemeStudioState(options);
  const existing = state.families[input.familyId];
  const now = new Date().toISOString();
  const builtInPreset = themePresets.find((preset) => preset.id === input.familyId);

  if (!existing && !builtInPreset) throw new ThemeStudioError(404, 'Theme family not found.');

  const record: ThemeStudioFamilyRecord = existing ?? {
    id: input.familyId,
    name: builtInPreset?.name ?? input.familyId,
    description: undefined,
    sourcePresetId: builtInPreset?.id ?? input.familyId,
    overrides: {},
    lifecycle: builtInPreset ? 'published' : 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const next: ThemeStudioFamilyRecord = {
    ...record,
    name: input.name?.trim() || record.name,
    description: input.description?.trim() ?? record.description,
    sourcePresetId: record.sourcePresetId || builtInPreset?.id || input.familyId,
    overrides: mergeThemeOverrides(record.overrides, input.overrides),
    updatedAt: now,
  };
  state.families[input.familyId] = next;
  writeThemeStudioState(state, options);
  return isBuiltInThemeId(input.familyId) ? viewFromPreset(getThemePreset(input.familyId), next) : viewFromRecord(next);
}

export function transitionThemeStudioFamily(input: TransitionThemeStudioFamilyInput, options: ThemeStudioStateOptions = {}): ThemeStudioFamilyView {
  const state = loadThemeStudioState(options);
  const record = state.families[input.familyId];
  if (!record) throw new ThemeStudioError(404, 'Theme family not found.');

  const next = { ...record, lifecycle: input.lifecycle, updatedAt: new Date().toISOString() } satisfies ThemeStudioFamilyRecord;
  validateLifecycleTransition(record.lifecycle, input.lifecycle);
  if (input.lifecycle === 'published') {
    const gate = evaluateThemePublishGate({ preset: getThemePreset(record.sourcePresetId), overrides: record.overrides });
    if (!gate.canPublish) {
      throw new ThemeStudioError(409, gate.blockingIssues.map((issue) => issue.message).join(' '));
    }
  }
  state.families[input.familyId] = next;
  writeThemeStudioState(state, options);
  return viewFromRecord(next);
}

export function deleteThemeStudioFamily(input: DeleteThemeStudioFamilyInput, options: ThemeStudioStateOptions = {}): void {
  const state = loadThemeStudioState(options);
  if (isBuiltInThemeId(input.familyId)) throw new ThemeStudioError(409, 'Built-in theme families cannot be deleted.');
  const record = state.families[input.familyId];
  if (!record) throw new ThemeStudioError(404, 'Theme family not found.');
  if (record.lifecycle === 'published' || record.lifecycle === 'deprecated' || record.lifecycle === 'archived') {
    throw new ThemeStudioError(409, 'Published theme families cannot be deleted.');
  }
  delete state.families[input.familyId];
  writeThemeStudioState(state, options);
}

export function getThemeStudioFamily(input: { familyId: string }, options: ThemeStudioStateOptions = {}): ThemeStudioFamilyView | null {
  const state = loadThemeStudioState(options);
  const record = state.families[input.familyId];
  if (record) return isBuiltInThemeId(input.familyId) ? viewFromPreset(getThemePreset(input.familyId), record) : viewFromRecord(record);
  const preset = themePresets.find((item) => item.id === input.familyId);
  return preset ? viewFromPreset(preset) : null;
}

export function resolveThemeStudioTheme(record: ThemeStudioFamilyRecord): ThemePreset {
  return mergeTheme(getThemePreset(record.sourcePresetId), record.overrides);
}

function viewFromPreset(preset: ThemePreset, record?: ThemeStudioFamilyRecord): ThemeStudioFamilyView {
  const effectiveRecord = record && record.sourcePresetId === preset.id ? record : undefined;
  const theme = effectiveRecord ? mergeTheme(preset, effectiveRecord.overrides) : preset;
  const gate = evaluateThemePublishGate({ preset, overrides: effectiveRecord?.overrides });
  return {
    id: preset.id,
    name: effectiveRecord?.name ?? preset.name,
    description: effectiveRecord?.description,
    sourcePresetId: preset.id,
    lifecycle: effectiveRecord?.lifecycle ?? 'published',
    isBuiltIn: true,
    canEdit: true,
    canDelete: false,
    canPublish: gate.canPublish,
    issues: gate.issues,
    theme,
  };
}

function viewFromRecord(record: ThemeStudioFamilyRecord): ThemeStudioFamilyView {
  const theme = resolveThemeStudioTheme(record);
  const gate = evaluateThemePublishGate({ preset: getThemePreset(record.sourcePresetId), overrides: record.overrides });
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    sourcePresetId: record.sourcePresetId,
    lifecycle: record.lifecycle,
    isBuiltIn: false,
    canEdit: true,
    canDelete: record.lifecycle !== 'published' && record.lifecycle !== 'deprecated' && record.lifecycle !== 'archived',
    canPublish: gate.canPublish,
    issues: gate.issues,
    theme,
  };
}

function mergeThemeOverrides(existing: ThemeOverrides, next?: ThemeOverrides): ThemeOverrides {
  return {
    colors: { ...existing.colors, ...next?.colors },
    typography: { ...existing.typography, ...next?.typography },
    layout: { ...existing.layout, ...next?.layout },
    assets: { ...existing.assets, ...next?.assets },
    spacing: { ...existing.spacing, ...next?.spacing },
  };
}

function validateLifecycleTransition(current: ThemeLifecycle, next: ThemeLifecycle): void {
  const order: ThemeLifecycle[] = ['draft', 'qa', 'published', 'deprecated', 'archived'];
  const currentIndex = order.indexOf(current);
  const nextIndex = order.indexOf(next);
  if (currentIndex === -1 || nextIndex === -1) throw new ThemeStudioError(400, 'Unknown lifecycle state.');
  if (nextIndex < currentIndex) throw new ThemeStudioError(409, `Cannot transition from ${current} to ${next}.`);
}

function uniqueFamilyId(baseId: string, state: ThemeStudioState): string {
  let candidate = baseId;
  let index = 2;
  while (themePresets.some((preset) => preset.id === candidate) || state.families[candidate]) {
    candidate = `${baseId}-${index}`;
    index += 1;
  }
  return candidate;
}

function isBuiltInThemeId(familyId: string): boolean {
  return themePresets.some((preset) => preset.id === familyId);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'theme-family';
}

function resolveRepoRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(resolve(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
