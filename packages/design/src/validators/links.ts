import { issue, type DesignIssue } from './issues';

export interface LinkInput {
  href: string;
  anchors?: readonly string[];
  path?: string;
}

export function validateLinks(links: readonly LinkInput[]): DesignIssue[] {
  const anchors = new Set(links.flatMap((link) => normalizeAnchors(link.anchors)));
  const issues: DesignIssue[] = [];

  for (const [index, link] of links.entries()) {
    if (!link.href.startsWith('#')) continue;
    const anchor = link.href.slice(1);
    if (anchor && anchors.has(anchor)) continue;
    issues.push(issue('links.anchor.broken', 'error', `Broken anchor link: ${link.href}.`, link.path ?? `links.${index}.href`, 'Create the matching section anchor.'));
  }

  return issues;
}

function normalizeAnchors(anchors: readonly string[] | undefined): string[] {
  return (anchors ?? []).map((anchor) => anchor.replace(/^#/, '').trim()).filter(Boolean);
}
