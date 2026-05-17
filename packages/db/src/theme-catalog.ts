export type ThemeCatalogPersonality = 'formal' | 'neutral' | 'soft' | 'playful';

export interface ThemeCatalogItem {
  id: string;
  name: string;
  personality: ThemeCatalogPersonality;
  lifecycle: 'published' | 'draft';
  recipe: Record<string, unknown>;
}

export interface ThemeCatalogFamily {
  id: string;
  name: string;
  description?: string;
  verticalFit: string[];
  personality: ThemeCatalogPersonality;
}

export interface ThemeCatalogVersion {
  id: string;
  themeFamilyId: string;
  version: string;
  lifecycle: 'published' | 'draft';
  recipeId: string;
}

export interface LegacyThemeMapping {
  family: ThemeCatalogFamily;
  version: ThemeCatalogVersion;
  recipe: Record<string, unknown>;
}

export interface ResolvedThemeCatalogItem {
  preset: ThemeCatalogItem;
  requestedPresetId: string | null;
  usedFallback: boolean;
  warning?: string;
}

export const themeCatalog = [
  {
    id: 'clinical-calm',
    name: 'Clinical Calm',
    personality: 'neutral',
    lifecycle: 'published',
    recipe: { density: 'spacious', nav: 'top', hero: 'split-image', radius: 'round' },
  },
  {
    id: 'editorial-bistro',
    name: 'Editorial Bistro',
    personality: 'soft',
    lifecycle: 'draft',
    recipe: { density: 'spacious', nav: 'centered', hero: 'full-bleed', radius: 'round' },
  },
  {
    id: 'organic-wellness',
    name: 'Organic Wellness',
    personality: 'soft',
    lifecycle: 'draft',
    recipe: { density: 'spacious', nav: 'minimal', hero: 'card-stack', radius: 'round' },
  },
  {
    id: 'neo-brutalist-local',
    name: 'Neo-Brutalist Local',
    personality: 'playful',
    lifecycle: 'draft',
    recipe: { density: 'compact', nav: 'top', hero: 'brutalist', radius: 'square' },
  },
  {
    id: 'luxury-dark-dining',
    name: 'Luxury Dark Dining',
    personality: 'soft',
    lifecycle: 'draft',
    recipe: { density: 'spacious', nav: 'overlay', hero: 'full-bleed', radius: 'round' },
  },
] as const satisfies readonly ThemeCatalogItem[];

export const defaultThemeCatalogItem = themeCatalog[0]!;

export function resolveThemeCatalogItem(presetId: string | null | undefined, onFallback?: (warning: string) => void): ResolvedThemeCatalogItem {
  const requestedPresetId = typeof presetId === 'string' && presetId.trim() ? presetId : null;
  if (!requestedPresetId) {
    return { preset: defaultThemeCatalogItem, requestedPresetId: null, usedFallback: true };
  }

  const preset = themeCatalog.find((item) => item.id === requestedPresetId);
  if (preset) {
    return { preset, requestedPresetId, usedFallback: false };
  }

  const warning = `Unknown theme preset "${requestedPresetId}". Falling back to ${defaultThemeCatalogItem.id}.`;
  onFallback?.(warning);
  return { preset: defaultThemeCatalogItem, requestedPresetId, usedFallback: true, warning };
}

export function mapLegacyThemePreset(presetId: string | null | undefined, overrides: Record<string, unknown> = {}): LegacyThemeMapping {
  const resolved = resolveThemeCatalogItem(presetId);
  return {
    family: {
      id: resolved.preset.id,
      name: resolved.preset.name,
      verticalFit: ['generic'],
      personality: resolved.preset.personality,
    },
    version: {
      id: `${resolved.preset.id}@1.0.0`,
      themeFamilyId: resolved.preset.id,
      version: '1.0.0',
      lifecycle: resolved.preset.lifecycle,
      recipeId: `${resolved.preset.id}-recipe`,
    },
    recipe: {
      id: `${resolved.preset.id}-recipe`,
      name: resolved.preset.name,
      presetId: resolved.preset.id,
      ...resolved.preset.recipe,
      overrides: Object.keys(overrides).length ? overrides : undefined,
    },
  };
}
