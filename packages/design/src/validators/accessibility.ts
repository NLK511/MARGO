import { issue, type DesignIssue } from './issues';
import { validateContrast } from './contrast';

export interface AccessibilityImageInput {
  alt?: string | null;
  path?: string;
  foreground?: string;
  background?: string;
}

export interface AccessibilityHeadingInput {
  level: number;
  path?: string;
}

export interface AccessibilityFormFieldInput {
  label?: string | null;
  ariaLabel?: string | null;
  path?: string;
}

export interface AccessibilityInput {
  images?: readonly AccessibilityImageInput[];
  headings?: readonly AccessibilityHeadingInput[];
  formFields?: readonly AccessibilityFormFieldInput[];
}

export function validateAccessibility(input: AccessibilityInput): DesignIssue[] {
  const issues: DesignIssue[] = [];

  input.images?.forEach((image, index) => {
    if (image.alt?.trim()) return;
    issues.push(issue('accessibility.image.alt-missing', 'error', 'Images need descriptive alt text.', image.path ?? `images.${index}.alt`, 'Add a short descriptive alt attribute.'));
    if (image.foreground && image.background) {
      issues.push(...validateContrast(image.foreground, image.background, 4.5, image.path ?? `images.${index}`));
    }
  });

  const headingLevels = input.headings?.map((heading) => heading.level) ?? [];
  if (hasHeadingJump(headingLevels)) {
    issues.push(issue('accessibility.heading.order', 'error', 'Headings must follow a logical order.', 'headings', 'Avoid skipping heading levels.'));
  }

  input.formFields?.forEach((field, index) => {
    if (field.label?.trim() || field.ariaLabel?.trim()) return;
    issues.push(issue('accessibility.form.label-missing', 'error', 'Form fields need labels or aria-labels.', field.path ?? `formFields.${index}`, 'Add a visible label or an aria-label.'));
  });

  return issues;
}

function hasHeadingJump(levels: readonly number[]): boolean {
  let previous = 0;
  for (const level of levels) {
    if (previous > 0 && level - previous > 1) return true;
    previous = level;
  }
  return false;
}
