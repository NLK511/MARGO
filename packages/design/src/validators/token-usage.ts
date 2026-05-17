import { issue, type DesignIssue } from './issues';

const RAW_SIZE_PATTERN = /^\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%)$/i;
const TOKEN_REF_PATTERN = /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)+$/i;
const DESIGN_SIZE_KEYS = /(?:fontSize|font|lineHeight|letterSpacing|margin|padding|gap|space|radius|width|height|size|shadow|blur|offset|top|right|bottom|left|inset)/i;

export interface TokenUsageViolation {
  path: string;
  value: string;
  kind: 'raw-size' | 'raw-spacing' | 'raw-typography';
}

export function validateTokenUsage(input: unknown, path = ''): DesignIssue[] {
  return collectTokenUsageIssues(input, path).map((violation) =>
    issue(
      'token.usage.raw',
      'error',
      `Use design tokens instead of raw ${violation.kind.replace('raw-', '')} values.`,
      violation.path,
      `Replace "${violation.value}" with a token reference.`,
    ),
  );
}

export function collectTokenUsageIssues(input: unknown, path = ''): TokenUsageViolation[] {
  const violations: TokenUsageViolation[] = [];
  walk(input, path, violations);
  return violations;
}

function walk(value: unknown, path: string, violations: TokenUsageViolation[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, appendPath(path, String(index)), violations));
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = appendPath(path, key);
    if (typeof nested === 'string' && DESIGN_SIZE_KEYS.test(key) && isRawDesignValue(nested)) {
      violations.push({
        path: nextPath,
        value: nested,
        kind: key.toLowerCase().includes('font') || key.toLowerCase().includes('lineheight') ? 'raw-typography' : 'raw-spacing',
      });
    }
    walk(nested, nextPath, violations);
  }
}

function isRawDesignValue(value: string): boolean {
  return RAW_SIZE_PATTERN.test(value) && !TOKEN_REF_PATTERN.test(value);
}

function appendPath(base: string, segment: string): string {
  return base ? `${base}.${segment}` : segment;
}
