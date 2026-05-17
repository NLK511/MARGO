export interface ThemeRecipe {
  id: string;
  name: string;
  personality: 'formal' | 'neutral' | 'soft' | 'playful';
  density: 'compact' | 'standard' | 'spacious';
  typography: {
    display: string;
    heading: string;
    body: string;
    label: string;
    caption: string;
    button: string;
  };
  colors: Record<string, string>;
  radius: 'formal' | 'neutral' | 'soft' | 'playful';
  fontPairingId: string;
  imageTreatment: 'neutral' | 'warm' | 'high-contrast';
  ctaTreatment: 'solid' | 'outline' | 'text';
  sectionRules: {
    rhythm: 'none' | 'compact' | 'standard' | 'spacious';
    divider: 'none' | 'thin' | 'thick';
  };
  componentStyles: {
    button: 'solid' | 'outline' | 'soft';
    card: 'flat' | 'soft-shadow' | 'glass' | 'brutalist';
    nav: 'top' | 'centered' | 'minimal' | 'overlay';
  };
}

export function validateThemeRecipe(recipe: Partial<ThemeRecipe>): string[] {
  const errors: string[] = [];
  if (!recipe.id?.trim()) errors.push('id is required');
  if (!recipe.name?.trim()) errors.push('name is required');
  if (!recipe.fontPairingId?.trim()) errors.push('fontPairingId is required');
  if (!recipe.imageTreatment) errors.push('imageTreatment is required');
  if (!recipe.ctaTreatment) errors.push('ctaTreatment is required');
  if (!recipe.sectionRules?.rhythm) errors.push('sectionRules.rhythm is required');
  if (!recipe.sectionRules?.divider) errors.push('sectionRules.divider is required');
  if (!recipe.componentStyles?.button) errors.push('componentStyles.button is required');
  if (!recipe.componentStyles?.card) errors.push('componentStyles.card is required');
  if (!recipe.componentStyles?.nav) errors.push('componentStyles.nav is required');
  return errors;
}
