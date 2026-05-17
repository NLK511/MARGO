import { issue, type DesignIssue } from './issues';

export interface PageBlockSummary {
  type: string;
  role?: string;
  variant?: string;
  isPrimaryCta?: boolean;
}

export interface PageSectionSummary {
  type: string;
  blocks?: readonly PageBlockSummary[];
}

export interface PageCompositionInput {
  pageType: 'landing' | 'service' | 'content' | string;
  sections: readonly PageSectionSummary[];
}

export function validatePageComposition(input: PageCompositionInput): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const heroes = findHeroes(input.sections);
  const ctas = findCtas(input.sections);

  if (heroes.length > 1) {
    issues.push(issue('page.composition.hero.duplicate', 'error', 'Only one hero section is allowed per page.', 'sections'));
  }

  if (input.pageType === 'landing' && ctas.length === 0) {
    issues.push(issue('page.composition.cta.missing', 'error', 'Landing pages need at least one clear CTA.', 'sections'));
  }

  const heroIndex = input.sections.findIndex((section) => isHeroSection(section));
  const ctaIndex = input.sections.findIndex((section) => isCtaSection(section));
  if (heroIndex > 0) {
    issues.push(issue('page.composition.hero.order', 'warning', 'Hero sections should appear first.', `sections.${heroIndex}`));
  }
  if (ctaIndex >= 0 && ctaIndex < input.sections.length - 1) {
    issues.push(issue('page.composition.cta.order', 'warning', 'CTA sections work best at the end of the page.', `sections.${ctaIndex}`));
  }

  return issues;
}

function findHeroes(sections: readonly PageSectionSummary[]): PageSectionSummary[] {
  return sections.filter(isHeroSection);
}

function findCtas(sections: readonly PageSectionSummary[]): PageSectionSummary[] {
  return sections.filter(isCtaSection);
}

function isHeroSection(section: PageSectionSummary): boolean {
  return section.type === 'hero' || section.blocks?.some((block) => block.type === 'hero' || block.role === 'hero') === true;
}

function isCtaSection(section: PageSectionSummary): boolean {
  return section.type === 'cta' || section.blocks?.some((block) => block.type === 'cta' || block.isPrimaryCta === true) === true;
}
