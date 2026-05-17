import type { DesignRecipe } from '../recipes/design-recipe';
import { radiusPersonalityMap, radiusTokens } from '../tokens/radius';

export function compileDesignVars(recipe: DesignRecipe): Record<string, string> {
  return {
    '--color-bg': recipe.colors.background,
    '--color-surface': recipe.colors.surface,
    '--color-surface-raised': recipe.colors.surfaceRaised,
    '--color-text-primary': recipe.colors.textPrimary,
    '--color-text-secondary': recipe.colors.textSecondary,
    '--color-text-tertiary': recipe.colors.textTertiary,
    '--color-border-subtle': recipe.colors.borderSubtle,
    '--color-border-strong': recipe.colors.borderStrong,
    '--color-action-primary': recipe.colors.actionPrimary,
    '--color-action-primary-text': recipe.colors.actionPrimaryText,
    '--color-accent': recipe.colors.accent,
    '--color-success': recipe.colors.success,
    '--color-warning': recipe.colors.warning,
    '--color-danger': recipe.colors.danger,
    '--radius-card': radiusTokens[radiusPersonalityMap[recipe.radius]],
  };
}
