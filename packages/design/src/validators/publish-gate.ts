import type { DesignIssue } from './issues';
import { validateAccessibility, type AccessibilityInput } from './accessibility';
import { validateHierarchy, type HierarchyInput } from './hierarchy';
import { validateLinks, type LinkInput } from './links';
import { validatePageComposition, type PageCompositionInput } from './page-composition';
import { validateTokenUsage } from './token-usage';

export interface PagePublishGateInput {
  pageType: PageCompositionInput['pageType'];
  sections: PageCompositionInput['sections'];
  tokens?: unknown;
  hierarchy?: HierarchyInput;
  accessibility?: AccessibilityInput;
  links?: readonly LinkInput[];
  content?: {
    title?: string | null;
    body?: string | null;
  };
}

export interface PublishGateResult {
  issues: DesignIssue[];
  blockingIssues: DesignIssue[];
  warningIssues: DesignIssue[];
  canPublish: boolean;
  canSaveDraft: boolean;
}

export function evaluatePagePublishGate(input: PagePublishGateInput): PublishGateResult {
  const issues = [
    ...validateTokenUsage(input.tokens ?? {}),
    ...validatePageComposition({ pageType: input.pageType, sections: input.sections }),
    ...validateHierarchy(input.hierarchy ?? { headlineWeight: 2, bodyWeight: 1, primaryButtons: 0, primaryElementPresent: true }),
    ...validateAccessibility(input.accessibility ?? {}),
    ...validateLinks(input.links ?? []),
    ...validateContentReadiness(input),
  ];

  const blockingIssues = issues.filter((issue) => issue.severity === 'error');
  const warningIssues = issues.filter((issue) => issue.severity === 'warning');

  return {
    issues,
    blockingIssues,
    warningIssues,
    canPublish: blockingIssues.length === 0,
    canSaveDraft: true,
  };
}

function validateContentReadiness(input: PagePublishGateInput): DesignIssue[] {
  if (input.pageType !== 'landing') return [];
  if (input.content?.title?.trim()) return [];
  return [{ code: 'content.title.missing', severity: 'error', message: 'Landing pages need a title.', path: 'content.title', suggestedFix: 'Add a clear page title.' }];
}
