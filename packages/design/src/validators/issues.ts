export type DesignIssueSeverity = 'info' | 'warning' | 'error';

export interface DesignIssue {
  code: string;
  severity: DesignIssueSeverity;
  message: string;
  path: string;
  suggestedFix?: string;
}

export function issue(code: string, severity: DesignIssueSeverity, message: string, path = '', suggestedFix?: string): DesignIssue {
  return { code, severity, message, path, suggestedFix };
}

export function isDesignIssue(value: unknown): value is DesignIssue {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as DesignIssue;
  return typeof candidate.code === 'string' && typeof candidate.severity === 'string' && typeof candidate.message === 'string' && typeof candidate.path === 'string';
}

export function validateDesignIssue(value: unknown): DesignIssue[] {
  return isDesignIssue(value)
    ? []
    : [issue('issue.invalid', 'error', 'Invalid design issue object.', '', 'Provide code, severity, message, and path.')];
}
