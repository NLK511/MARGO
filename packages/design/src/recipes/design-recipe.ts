import type { SemanticColorScheme } from '../tokens/color';
import type { RadiusPersonality } from '../tokens/radius';
import type { TypographyScale } from '../tokens/typography';

export interface DesignRecipe {
  id: string;
  name: string;
  personality: 'formal' | 'neutral' | 'soft' | 'playful';
  density: 'compact' | 'standard' | 'spacious';
  typography: TypographyScale;
  colors: SemanticColorScheme;
  radius: RadiusPersonality;
}

export function validateDesignRecipe(recipe: DesignRecipe): string[] {
  const errors: string[] = [];
  if (!recipe.id.trim()) errors.push('id is required');
  if (!recipe.name.trim()) errors.push('name is required');
  if (!recipe.personality) errors.push('personality is required');
  if (!recipe.typography) errors.push('typography is required');
  if (!recipe.colors) errors.push('colors is required');
  return errors;
}
