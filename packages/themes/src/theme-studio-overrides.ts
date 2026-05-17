import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getThemePreset, mergeTheme, resolveThemePresetOrFallback, type ThemeOverrides, type ThemePreset } from './index';

interface ThemeStudioFamilyRecord {
  sourcePresetId: string;
  overrides?: ThemeOverrides;
}

interface ThemeStudioState {
  families?: Record<string, ThemeStudioFamilyRecord>;
}

export function resolveThemePresetWithStudioOverrides(
  presetId: string | null | undefined,
  onFallback?: (warning: string) => void,
  startDir = process.cwd(),
): ThemePreset {
  const requestedPresetId = typeof presetId === 'string' && presetId.trim() ? presetId.trim() : null;
  const state = loadThemeStudioState(startDir);
  const studioFamily = requestedPresetId ? state.families?.[requestedPresetId] : undefined;

  if (studioFamily) {
    const basePreset = getThemePreset(studioFamily.sourcePresetId || requestedPresetId);
    return mergeTheme(basePreset, studioFamily.overrides ?? {});
  }

  return resolveThemePresetOrFallback(requestedPresetId, onFallback).preset;
}

function loadThemeStudioState(startDir: string): ThemeStudioState {
  const statePath = resolveThemeStudioStatePath(startDir);
  if (!statePath || !existsSync(statePath)) return {};

  try {
    const raw = JSON.parse(readFileSync(statePath, 'utf8')) as unknown;
    return isPlainObject(raw) && isPlainObject(raw.families) ? { families: raw.families as Record<string, ThemeStudioFamilyRecord> } : {};
  } catch {
    return {};
  }
}

function resolveThemeStudioStatePath(startDir = process.cwd()): string {
  let current = startDir;
  while (true) {
    const candidate = resolve(current, '.margo', 'theme-studio-state.json');
    if (existsSync(candidate)) return candidate;

    const parent = dirname(current);
    if (parent === current) return candidate;
    current = parent;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
