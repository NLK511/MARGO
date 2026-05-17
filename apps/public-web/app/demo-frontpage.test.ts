import { describe, expect, it } from 'vitest';
import { getDemoFrontpageModel } from './demo-frontpage';

describe('demo frontpage models', () => {
  it('includes a Chef tenant preview that mirrors the reference site layout', () => {
    const model = getDemoFrontpageModel('chef');

    expect(model?.tenant.themePresetId).toBe('chef');
    expect(model?.tenant.layoutConfig?.nav).toBe('centered');
    expect(model?.page.blocks[0]?.type).toBe('hero');
    expect(model?.page.blocks.some((block) => block.type === 'carousel')).toBe(true);
    expect(model?.page.blocks.some((block) => block.type === 'service-list')).toBe(true);
  });
});
