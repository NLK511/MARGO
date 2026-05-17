export type ThemeFamilyId = string;
export type ThemeLifecycle = 'draft' | 'qa' | 'published' | 'deprecated' | 'archived';

export interface ThemeVersion {
  id: string;
  themeFamilyId: ThemeFamilyId;
  version: string;
  lifecycle: ThemeLifecycle;
  recipeId: string;
}

export interface ThemeFamily {
  id: ThemeFamilyId;
  name: string;
  description?: string;
  verticalFit: readonly string[];
  personality: 'formal' | 'neutral' | 'soft' | 'playful';
  versions: readonly ThemeVersion[];
}

export const themeLifecycleOrder: readonly ThemeLifecycle[] = ['draft', 'qa', 'published', 'deprecated', 'archived'];

export function validateThemeFamily(family: ThemeFamily): string[] {
  const errors: string[] = [];
  if (!family.id.trim()) errors.push('id is required');
  if (!family.name.trim()) errors.push('name is required');
  if (!family.verticalFit.length) errors.push('verticalFit is required');
  if (!family.personality) errors.push('personality is required');
  if (!family.versions.length) errors.push('versions is required');
  if (new Set(family.versions.map((version) => version.id)).size !== family.versions.length) errors.push('version ids must be unique');
  return errors;
}

export function validateThemeLifecycleTransition(from: ThemeLifecycle, to: ThemeLifecycle): string | null {
  const fromIndex = themeLifecycleOrder.indexOf(from);
  const toIndex = themeLifecycleOrder.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return 'Unknown lifecycle state.';
  if (toIndex < fromIndex) return `Cannot transition from ${from} to ${to}.`;
  return null;
}
