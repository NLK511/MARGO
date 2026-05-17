import { issue, type DesignIssue } from './issues';

export interface HierarchyInput {
  headlineWeight: number;
  bodyWeight: number;
  primaryButtons: number;
  primaryElementPresent: boolean;
}

export function validateHierarchy(input: HierarchyInput): DesignIssue[] {
  const issues: DesignIssue[] = [];

  if (input.headlineWeight <= input.bodyWeight) {
    issues.push(issue('hierarchy.emphasis.equal', 'error', 'Headline emphasis must be stronger than body text.', 'headlineWeight'));
  }

  if (input.primaryButtons > 1) {
    issues.push(issue('hierarchy.primary-buttons.multiple', 'error', 'Only one primary button should be used per section.', 'primaryButtons'));
  }

  if (!input.primaryElementPresent) {
    issues.push(issue('hierarchy.primary-element.missing', 'error', 'A primary visual element is required.', 'primaryElementPresent'));
  }

  return issues;
}
