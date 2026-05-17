import { describe, expect, it } from 'vitest';
import { validateDesignIssue } from './issues';
import { validateTokenUsage } from './token-usage';
import { validatePageComposition } from './page-composition';
import { validateHierarchy } from './hierarchy';
import { validateAccessibility } from './accessibility';
import { validateLinks } from './links';
import { evaluatePagePublishGate } from './publish-gate';

describe('design validators', () => {
  it('validates issue objects', () => {
    expect(validateDesignIssue({ code: 'x' })).toHaveLength(1);
  });

  it('flags raw font and spacing values', () => {
    const issues = validateTokenUsage({ button: { fontSize: '18px', padding: '12px' }, nested: [{ marginTop: '24px' }] });
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['button.fontSize', 'button.padding', 'nested.0.marginTop']));
    expect(validateTokenUsage({ button: { fontSize: 'type.body', padding: 'space.4' } })).toEqual([]);
  });

  it('validates page composition rules', () => {
    const duplicateHero = validatePageComposition({ pageType: 'landing', sections: [{ type: 'hero' }, { type: 'hero' }] });
    const missingCta = validatePageComposition({ pageType: 'landing', sections: [{ type: 'hero' }, { type: 'rich-text' }] });
    const ordered = validatePageComposition({ pageType: 'landing', sections: [{ type: 'hero' }, { type: 'content' }, { type: 'cta' }] });

    expect(duplicateHero.some((issue) => issue.code === 'page.composition.hero.duplicate')).toBe(true);
    expect(missingCta.some((issue) => issue.code === 'page.composition.cta.missing')).toBe(true);
    expect(ordered).toEqual([]);
  });

  it('validates visual hierarchy and accessibility rules', () => {
    expect(validateHierarchy({ headlineWeight: 400, bodyWeight: 400, primaryButtons: 2, primaryElementPresent: false }).length).toBe(3);
    expect(validateAccessibility({ images: [{ path: 'images.0', alt: '' }], headings: [{ level: 1 }, { level: 3 }], formFields: [{ path: 'form.0' }] }).some((issue) => issue.code === 'accessibility.heading.order')).toBe(true);
  });

  it('validates internal links and publish readiness', () => {
    expect(validateLinks([{ href: '#hero', anchors: ['hero'] }])).toEqual([]);
    expect(validateLinks([{ href: '#missing', anchors: ['hero'] }]).some((issue) => issue.code === 'links.anchor.broken')).toBe(true);

    const result = evaluatePagePublishGate({
      pageType: 'landing',
      sections: [{ type: 'hero' }, { type: 'cta' }],
      content: { title: 'Home' },
      hierarchy: { headlineWeight: 700, bodyWeight: 400, primaryButtons: 1, primaryElementPresent: true },
      accessibility: { images: [{ alt: 'Decorative product shot' }], headings: [{ level: 1 }, { level: 2 }], formFields: [{ label: 'Email' }] },
      links: [{ href: '#hero', anchors: ['hero'] }],
      tokens: { section: { padding: 'space.4' } },
    });

    expect(result.canPublish).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
