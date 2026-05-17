import { describe, expect, it } from 'vitest';
import {
  createDefaultPageBlockProps,
  evaluatePageBlockGovernance,
  getPageBlockDefinition,
  getPageBlockPlacementOptions,
  pageBlockRegistry,
  validatePageBlockRegistry,
} from './page-block-registry';

describe('page block registry requirements', () => {
  it('keeps enriched metadata for block governance and hierarchy guidance', () => {
    expect(pageBlockRegistry.map((definition) => definition.type)).toContain('service-list');
    expect(getPageBlockDefinition('hero')?.allowedPagePositions).toEqual(['top']);
    expect(getPageBlockDefinition('service-list')?.compositionRules[0]).toContain('hero or supporting introduction');
    expect(createDefaultPageBlockProps('cta', 'Book now')).toMatchObject({ buttonLabel: 'Contact us', buttonHref: '#contact' });
  });

  it('reports placement guidance and governance warnings', () => {
    expect(validatePageBlockRegistry()).toEqual([]);
    expect(getPageBlockPlacementOptions([{ type: 'hero' }]).find((option) => option.value === 'hero')?.disabled).toBe(true);

    const issues = evaluatePageBlockGovernance([
      { type: 'rich-text', props: { body: 'A short intro' } },
      { type: 'hero', props: { headline: 'Welcome', ctaLabel: 'Book now' } },
      { type: 'cta', props: { buttonLabel: 'Contact us', buttonHref: '#contact' } },
      { type: 'rich-text', props: { body: 'A short intro' } },
    ]);

    expect(issues.some((issue) => issue.code === 'hero.order')).toBe(true);
    expect(issues.some((issue) => issue.code === 'cta.order')).toBe(true);
  });
});
