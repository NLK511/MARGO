import { describe, expect, it } from 'vitest';
import { validateThemeRecipe } from './theme-recipe';
import { themePresets } from './index';

describe('theme recipe model', () => {
  it('validates a complete recipe', () => {
    const preset = themePresets[0];
    const errors = validateThemeRecipe({
      id: 'clinical-calm',
      name: 'Clinical Calm',
      personality: 'neutral',
      density: 'standard',
      typography: {
        display: preset.typography.fontDisplay,
        heading: preset.typography.fontDisplay,
        body: preset.typography.fontSans,
        label: preset.typography.fontSans,
        caption: preset.typography.fontSans,
        button: preset.typography.fontSans,
      },
      colors: { background: preset.colors.bg },
      radius: 'neutral',
      fontPairingId: 'Inter__Inter',
      imageTreatment: 'neutral',
      ctaTreatment: 'solid',
      sectionRules: { rhythm: 'standard', divider: 'thin' },
      componentStyles: { button: 'solid', card: 'soft-shadow', nav: 'top' },
    });

    expect(errors).toEqual([]);
  });

  it('flags missing required recipe fields', () => {
    expect(validateThemeRecipe({} as never).length).toBeGreaterThan(0);
  });
});
