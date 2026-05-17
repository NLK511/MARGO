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
  return [
    ...themePresets.map((preset) => viewFromPreset(preset)),
    ...Object.values(state.families).map((family) => viewFromRecord(family)),
  ];
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
  const record = state.families[input.familyId];
  if (!record) throw new ThemeStudioError(404, 'Theme family not found.');
  if (record.lifecycle !== 'draft' && record.lifecycle !== 'qa') throw new ThemeStudioError(409, 'Only draft or QA themes can be edited.');

  const next: ThemeStudioFamilyRecord = {
    ...record,
    name: input.name?.trim() || record.name,
    description: input.description?.trim() ?? record.description,
    overrides: mergeThemeOverrides(record.overrides, input.overrides),
    updatedAt: new Date().toISOString(),
  };
  state.families[input.familyId] = next;
  writeThemeStudioState(state, options);
  return viewFromRecord(next);
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
  return record ? viewFromRecord(record) : null;
}

export function resolveThemeStudioTheme(record: ThemeStudioFamilyRecord): ThemePreset {
  return mergeTheme(getThemePreset(record.sourcePresetId), record.overrides);
}

function viewFromPreset(preset: ThemePreset): ThemeStudioFamilyView {
  const gate = evaluateThemePublishGate({ preset });
  return {
    id: preset.id,
    name: preset.name,
    sourcePresetId: preset.id,
    lifecycle: 'published',
    isBuiltIn: true,
    canPublish: gate.canPublish,
    issues: gate.issues,
    theme: preset,
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
