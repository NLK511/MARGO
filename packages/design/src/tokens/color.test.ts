import { describe, expect, it } from 'vitest';
import { buildShadeRamp, compileSemanticColors, hsl } from './color';
import { contrastRatio } from '../validators/contrast';

describe('color tokens', () => {
  it('builds an HSL shade ramp', () => {
    const ramp = buildShadeRamp(hsl(222, 55, 12));
    expect(ramp[400]).toContain('hsl(222 55% 12%)');
    expect(ramp[50]).toContain('hsl(');
  });

  it('compiles semantic colors and contrast', () => {
    const colors = compileSemanticColors({ base: hsl(222, 55, 12) });
    expect(colors.actionPrimaryText).toBe('#ffffff');
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThan(7);
  });
});
