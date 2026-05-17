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
