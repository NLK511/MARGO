import { describe, expect, it } from 'vitest';
import { compileDesignVars } from './css/compile-design-vars';
import { compileSemanticColors, hsl } from './tokens/color';
import { radiusPersonalityMap } from './tokens/radius';
import { defaultTypographyScale } from './tokens/typography';

describe('design recipe compilation', () => {
  it('compiles stable css vars', () => {
    const vars = compileDesignVars({
      id: 'editorial-bistro',
      name: 'Editorial Bistro',
      personality: 'soft',
      density: 'standard',
      typography: defaultTypographyScale,
      colors: compileSemanticColors({ base: hsl(222, 55, 12) }),
      radius: 'soft',
    });

    expect(vars['--color-bg']).toBeTruthy();
    expect(vars['--radius-card']).toBeDefined();
    expect(vars['--radius-card']).toBe('18px');
  });

  it('uses radius personality mapping', () => {
    expect(radiusPersonalityMap.formal).toBe('sm');
    expect(radiusPersonalityMap.playful).toBe('xl');
  });
});
