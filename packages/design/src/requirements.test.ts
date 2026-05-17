import { describe, expect, it } from 'vitest';
import { doctrineStatements } from './doctrine';
import { compileDesignVars } from './css/compile-design-vars';
import { compileSemanticColors, hsl } from './tokens/color';
import { elevationTokens } from './tokens/elevation';
import { motionTokens } from './tokens/motion';
import { radiusPersonalityMap } from './tokens/radius';
import { spaceTokens } from './tokens/space';
import { defaultTypographyScale, typeTokens } from './tokens/typography';
import { validateContrast } from './validators/contrast';
import { validateTokenUsage } from './validators/token-usage';

const baseColors = compileSemanticColors({ base: hsl(222, 55, 12) });

describe('design requirements coverage', () => {
  it('keeps doctrine, spacing, typography, radius, elevation, and motion tokens source-controlled', () => {
    expect(Object.keys(doctrineStatements)).toContain('publishQualityGated');
    expect(spaceTokens['space.8']).toBe('24px');
    expect(typeTokens.h1).toBe('60px');
    expect(defaultTypographyScale.body).toBe('body');
    expect(radiusPersonalityMap.soft).toBe('lg');
    expect(elevationTokens.medium).toContain('rgb(15 23 42 / 0.12)');
    expect(motionTokens.standard).toBe('180ms');
  });

  it('keeps semantic colors contrast-safe and rejects raw design values', () => {
    expect(baseColors.actionPrimaryText).toBe('#ffffff');
    expect(validateContrast('#ffffff', '#fefefe')).toHaveLength(1);
    expect(validateTokenUsage({ button: { fontSize: '18px', padding: '12px' } }).length).toBe(2);
  });

  it('compiles stable css variables from a recipe', () => {
    const vars = compileDesignVars({
      id: 'editorial-bistro',
      name: 'Editorial Bistro',
      personality: 'soft',
      density: 'standard',
      typography: {
        display: 'h1',
        heading: 'h2',
        body: 'body',
        label: 'body',
        caption: 'small',
        button: 'body',
      },
      colors: baseColors,
      radius: 'soft',
    });

    expect(vars['--color-bg']).toBeTruthy();
    expect(vars['--radius-card']).toBe('18px');
  });
});
