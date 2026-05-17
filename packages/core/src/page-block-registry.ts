import { createCarouselPresetProps } from './carousel-presets';

export type PageBlockType = 'hero' | 'service-list' | 'image' | 'carousel' | 'split-media' | 'rich-text' | 'location' | 'contact-form' | 'cta';
export type PageBlockRole = 'hero' | 'content' | 'media' | 'support' | 'utility' | 'conversion';
export type PageBlockPosition = 'top' | 'body' | 'bottom' | 'footer';
export type PageBlockSeverity = 'info' | 'warning' | 'error';

export interface PageBlockGovernanceIssue {
  code: string;
  severity: PageBlockSeverity;
  message: string;
  path?: string;
  suggestedFix?: string;
}

export type PageBlockDefinition = {
  type: PageBlockType;
  label: string;
  description: string;
  intendedUse: string;
  overlapsWith: string[];
  defaultVariant: string;
  role: PageBlockRole;
  allowedPagePositions: readonly PageBlockPosition[];
  maxPerPage: number;
  requiredContent: readonly string[];
  optionalContent: readonly string[];
  variants: readonly string[];
  designRules: readonly string[];
  compositionRules: readonly string[];
  createDefaultProps(label: string): Record<string, unknown>;
};

type PageBlockLike = { type: string; variant?: string; props?: Record<string, unknown> };

export const pageBlockRegistry: readonly PageBlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Primary above-the-fold section.',
    intendedUse: 'Use once per page as the main entry point and strongest call to action.',
    overlapsWith: ['split-media', 'rich-text'],
    defaultVariant: 'split-image',
    role: 'hero',
    allowedPagePositions: ['top'],
    maxPerPage: 1,
    requiredContent: ['headline', 'ctaLabel'],
    optionalContent: ['eyebrow', 'body', 'secondaryLabel', 'secondaryHref', 'panelLabel', 'panelTitle', 'panelBody', 'panelMeta', 'highlights', 'backgroundImage'],
    variants: ['split-image', 'full-bleed', 'card-stack', 'brutalist'],
    designRules: ['Use one strong headline.', 'Keep the first screen focused on one primary action.'],
    compositionRules: ['Keep the hero first.', 'Do not repeat the hero on a single page.'],
    createDefaultProps(label) {
      return { eyebrow: 'Welcome', headline: label, body: '', ctaLabel: 'Book now', buttonLabel: 'Book now', buttonHref: '#contact' };
    },
  },
  {
    type: 'service-list',
    label: 'Service list',
    description: 'Structured list of offerings.',
    intendedUse: 'Use for services, menu items, treatments, packages, or pricing-focused content.',
    overlapsWith: ['rich-text', 'carousel'],
    defaultVariant: 'cards',
    role: 'support',
    allowedPagePositions: ['body', 'bottom'],
    maxPerPage: 2,
    requiredContent: ['title'],
    optionalContent: ['buttonLabel', 'buttonHref'],
    variants: ['cards', 'list', 'featured'],
    designRules: ['Prefer semantic service names and short descriptions.'],
    compositionRules: ['Use after the hero or supporting introduction.'],
    createDefaultProps() {
      return { title: 'What we offer', buttonLabel: 'View services', buttonHref: '#services' };
    },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Single image with optional overlays.',
    intendedUse: 'Use for one strong visual, a feature image, or an image-led callout.',
    overlapsWith: ['carousel', 'split-media'],
    defaultVariant: 'cover',
    role: 'media',
    allowedPagePositions: ['top', 'body', 'bottom'],
    maxPerPage: 3,
    requiredContent: ['imageUrl'],
    optionalContent: ['caption', 'alt', 'buttonEnabled', 'buttonLabel', 'buttonHref', 'buttonPosition', 'buttonStyle', 'buttonTextStyle', 'buttonSpacing', 'overlays'],
    variants: ['cover', 'framed'],
    designRules: ['Use framed overlays or a clear scrim for text-heavy visuals.'],
    compositionRules: ['Keep overlay text short and readable.'],
    createDefaultProps() {
      return { caption: 'A seasonal visual block.', imageUrl: '', buttonEnabled: false, buttonLabel: 'View gallery', buttonHref: '#gallery', buttonPosition: 'bottom-right', buttonStyle: 'primary', buttonTextStyle: { fontFamily: '', color: '', fontSize: '', lineHeight: '', textAlign: '' }, buttonSpacing: { margin: '', padding: '' } };
    },
  },
  {
    type: 'carousel',
    label: 'Carousel',
    description: 'Scrollable feature strip with preset content modes.',
    intendedUse: 'Use for featured items, testimonials, offers, or a compact image collection when several items need equal weight.',
    overlapsWith: ['service-list', 'image', 'rich-text'],
    defaultVariant: 'cards',
    role: 'media',
    allowedPagePositions: ['body', 'bottom'],
    maxPerPage: 1,
    requiredContent: ['slides'],
    optionalContent: ['title', 'body', 'visibleCount', 'mode', 'style', 'autoAdvanceMs'],
    variants: ['cards', 'testimonials', 'offers', 'gallery'],
    designRules: ['Keep each slide focused on one message.'],
    compositionRules: ['Use only one carousel per page.'],
    createDefaultProps(label) {
      return createCarouselPresetProps('cards', {
        eyebrow: 'Featured',
        title: label,
        body: 'A simple scrollable carousel for highlights, testimonials, or featured services.',
      });
    },
  },
  {
    type: 'split-media',
    label: 'Split media',
    description: 'Text and media side-by-side section.',
    intendedUse: 'Use for editorial sections that need a narrative paragraph plus one supporting image or video.',
    overlapsWith: ['hero', 'image'],
    defaultVariant: 'image-right',
    role: 'content',
    allowedPagePositions: ['body'],
    maxPerPage: 2,
    requiredContent: ['title', 'body'],
    optionalContent: ['textTitle', 'mediaSide', 'mediaType', 'imageUrl', 'videoUrl', 'alt', 'textStyle', 'textSpacing', 'mediaSpacing'],
    variants: ['image-left', 'image-right'],
    designRules: ['Keep text and media balanced.'],
    compositionRules: ['Use one clear supporting visual per block.'],
    createDefaultProps() {
      return { title: 'A split media block', textTitle: 'A split media block', body: 'Combine a short story with one supporting image or video.', mediaSide: 'image-left', mediaType: 'image', imageUrl: '', videoUrl: '', alt: '', textStyle: { fontFamily: '', color: '', fontSize: '', lineHeight: '' }, textSpacing: { margin: '', padding: '', interline: '' }, mediaSpacing: { margin: '', padding: '' } };
    },
  },
  {
    type: 'rich-text',
    label: 'Rich text',
    description: 'Plain editorial content block.',
    intendedUse: 'Use for copy-heavy sections when structure is simple and media is not needed.',
    overlapsWith: ['split-media', 'service-list'],
    defaultVariant: 'default',
    role: 'content',
    allowedPagePositions: ['body', 'bottom'],
    maxPerPage: 6,
    requiredContent: ['title', 'body'],
    optionalContent: ['textStyle'],
    variants: ['default'],
    designRules: ['Keep line lengths readable.'],
    compositionRules: ['Avoid stacking too many rich-text sections back-to-back.'],
    createDefaultProps(label) {
      return { title: label, body: 'Add your page content here.' };
    },
  },
  {
    type: 'location',
    label: 'Location',
    description: 'Address, hours, and contact details.',
    intendedUse: 'Use for visit information, opening hours, or a contact summary.',
    overlapsWith: ['contact-form', 'rich-text'],
    defaultVariant: 'card',
    role: 'utility',
    allowedPagePositions: ['bottom', 'footer'],
    maxPerPage: 2,
    requiredContent: ['title'],
    optionalContent: ['buttonLabel', 'buttonHref'],
    variants: ['card'],
    designRules: ['Keep address and contact details concise.'],
    compositionRules: ['Usually works near the bottom of the page.'],
    createDefaultProps() {
      return { title: 'Location and hours', buttonLabel: 'Get directions', buttonHref: '#location' };
    },
  },
  {
    type: 'contact-form',
    label: 'Contact form',
    description: 'Lead capture or inquiry form placeholder.',
    intendedUse: 'Use as a contact section when you want a form first and a call to action second.',
    overlapsWith: ['cta', 'location'],
    defaultVariant: 'placeholder',
    role: 'conversion',
    allowedPagePositions: ['bottom', 'footer'],
    maxPerPage: 1,
    requiredContent: ['title'],
    optionalContent: ['buttonLabel', 'buttonHref'],
    variants: ['placeholder'],
    designRules: ['Keep the form simple and low-friction.'],
    compositionRules: ['Place after supportive content.'],
    createDefaultProps() {
      return { title: 'Contact us', buttonLabel: 'Email us', buttonHref: 'mailto:hello@example.com' };
    },
  },
  {
    type: 'cta',
    label: 'CTA band',
    description: 'Single-purpose conversion section.',
    intendedUse: 'Use for one clear action when the page should end with a direct conversion prompt.',
    overlapsWith: ['contact-form', 'hero'],
    defaultVariant: 'banner',
    role: 'conversion',
    allowedPagePositions: ['bottom', 'footer'],
    maxPerPage: 1,
    requiredContent: ['title', 'buttonLabel'],
    optionalContent: ['body', 'buttonHref'],
    variants: ['banner'],
    designRules: ['End the page with one clear action.'],
    compositionRules: ['Keep the CTA near the end of the page.'],
    createDefaultProps(label) {
      return { title: label, body: 'Get in touch with our team today.', label: 'Contact us', buttonLabel: 'Contact us', buttonHref: '#contact' };
    },
  },
] as const;

export function getPageBlockDefinition(type: string): PageBlockDefinition | undefined {
  return pageBlockRegistry.find((definition) => definition.type === type);
}

export function getPageBlockOptions(): Array<{ value: PageBlockType; label: string }> {
  return pageBlockRegistry.map((definition) => ({ value: definition.type, label: definition.label }));
}

export function getPageBlockPlacementOptions(blocks: PageBlockLike[] = []): Array<{ value: PageBlockType; label: string; disabled: boolean; reason?: string }> {
  const counts = new Map<PageBlockType, number>();
  for (const block of blocks) {
    if (getPageBlockDefinition(block.type)) counts.set(block.type as PageBlockType, (counts.get(block.type as PageBlockType) ?? 0) + 1);
  }

  return pageBlockRegistry.map((definition) => {
    const count = counts.get(definition.type) ?? 0;
    const disabled = count >= definition.maxPerPage;
    return {
      value: definition.type,
      label: definition.label,
      disabled,
      reason: disabled ? `Limit ${definition.maxPerPage} per page` : definition.allowedPagePositions.length ? `Best for ${definition.allowedPagePositions.join(', ')}` : undefined,
    };
  });
}

export function createDefaultPageBlockProps(type: string, label: string): Record<string, unknown> {
  return getPageBlockDefinition(type)?.createDefaultProps(label) ?? { title: label };
}

export function evaluatePageBlockGovernance(blocks: PageBlockLike[]): PageBlockGovernanceIssue[] {
  const issues: PageBlockGovernanceIssue[] = [];
  const counts = new Map<PageBlockType, number>();

  blocks.forEach((block, index) => {
    const definition = getPageBlockDefinition(block.type);
    if (!definition) {
      issues.push({ code: 'block.unknown-type', severity: 'error', message: `Unknown block type: ${block.type}`, path: `blocks[${index}]` });
      return;
    }

    counts.set(definition.type, (counts.get(definition.type) ?? 0) + 1);

    if (definition.type === 'hero') {
      if (index > 0) {
        issues.push({ code: 'hero.order', severity: 'warning', message: 'Hero blocks should be first on the page.', path: `blocks[${index}]`, suggestedFix: 'Move the hero to the top.' });
      }
      if (!stringValue(block.props?.headline) || !stringValue(block.props?.ctaLabel)) {
        issues.push({ code: 'hero.required-content', severity: 'error', message: 'Hero blocks need a headline and a CTA label.', path: `blocks[${index}]`, suggestedFix: 'Add a headline and CTA label.' });
      }
    }

    if (definition.type === 'cta') {
      if (index < blocks.length - 1) {
        issues.push({ code: 'cta.order', severity: 'warning', message: 'CTA bands work best at the end of the page.', path: `blocks[${index}]`, suggestedFix: 'Move the CTA to the bottom.' });
      }
      if (!stringValue(block.props?.buttonLabel) || !stringValue(block.props?.buttonHref)) {
        issues.push({ code: 'cta.required-content', severity: 'error', message: 'CTA bands need a button label and destination.', path: `blocks[${index}]`, suggestedFix: 'Add button text and a link.' });
      }
    }

    if (definition.type === 'rich-text') {
      const body = stringValue(block.props?.body) ?? '';
      const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const longestLine = lines.reduce((length, line) => Math.max(length, line.length), 0);
      const textAlign = stringValue(block.props?.textStyle && typeof block.props.textStyle === 'object' ? (block.props.textStyle as Record<string, unknown>).textAlign : undefined) ?? '';
      if (textAlign === 'center' && longestLine > 80) {
        issues.push({ code: 'rich-text.centered', severity: 'warning', message: 'Centered rich text should stay short.', path: `blocks[${index}]`, suggestedFix: 'Use left alignment for longer paragraphs.' });
      }
      if (longestLine > 120) {
        issues.push({ code: 'rich-text.line-length', severity: 'warning', message: 'Rich text lines should stay readable.', path: `blocks[${index}]`, suggestedFix: 'Break long lines into shorter paragraphs.' });
      }
      if (!body.trim()) {
        issues.push({ code: 'rich-text.empty', severity: 'warning', message: 'Rich text blocks should contain copy.', path: `blocks[${index}]`, suggestedFix: 'Add body text.' });
      }
    }

    if (definition.type === 'image') {
      const overlays = Array.isArray(block.props?.overlays) ? (block.props?.overlays as Array<Record<string, unknown>>) : [];
      if (overlays.length > 0) {
        const hasFramedOverlay = overlays.some((overlay) => overlay.framed === true);
        const maxOverlayLength = overlays.reduce((length, overlay) => Math.max(length, stringValue(overlay.text)?.length ?? 0), 0);
        if (!hasFramedOverlay && maxOverlayLength > 0) {
          issues.push({ code: 'image.overlay-readability', severity: 'warning', message: 'Image overlays need a framed overlay or scrim for readable text.', path: `blocks[${index}]`, suggestedFix: 'Enable framed overlay styling.' });
        }
        if (maxOverlayLength > 90) {
          issues.push({ code: 'image.overlay-length', severity: 'warning', message: 'Image overlay text is too long.', path: `blocks[${index}]`, suggestedFix: 'Shorten overlay copy.' });
        }
      }
      if (!stringValue(block.props?.imageUrl) && !overlays.length) {
        issues.push({ code: 'image.empty', severity: 'warning', message: 'Image blocks should include an image or overlays.', path: `blocks[${index}]`, suggestedFix: 'Upload an image or add overlay content.' });
      }
    }

    if (definition.type === 'split-media') {
      if (!stringValue(block.props?.imageUrl) && !stringValue(block.props?.videoUrl)) {
        issues.push({ code: 'split-media.empty', severity: 'warning', message: 'Split media blocks need an image or video.', path: `blocks[${index}]`, suggestedFix: 'Upload media for the block.' });
      }
      if ((stringValue(block.props?.imageUrl) || stringValue(block.props?.videoUrl)) && !stringValue(block.props?.alt)) {
        issues.push({ code: 'split-media.alt', severity: 'warning', message: 'Split media blocks should include alt text.', path: `blocks[${index}]`, suggestedFix: 'Add descriptive alt text.' });
      }
    }
  });

  for (const definition of pageBlockRegistry) {
    const count = counts.get(definition.type) ?? 0;
    if (count > definition.maxPerPage) {
      issues.push({
        code: `${definition.type}.max-per-page`,
        severity: 'error',
        message: `${definition.label} blocks are limited to ${definition.maxPerPage} per page.`,
        suggestedFix: `Keep only ${definition.maxPerPage} ${definition.label.toLowerCase()} block${definition.maxPerPage === 1 ? '' : 's'}.`,
      });
    }
  }

  return issues;
}

export function validatePageBlockRegistry(): PageBlockGovernanceIssue[] {
  const issues: PageBlockGovernanceIssue[] = [];
  for (const definition of pageBlockRegistry) {
    if (!definition.role) issues.push({ code: `${definition.type}.missing-role`, severity: 'error', message: `${definition.type} is missing a role.` });
    if (!definition.allowedPagePositions.length) issues.push({ code: `${definition.type}.missing-positions`, severity: 'error', message: `${definition.type} is missing allowed positions.` });
    if (!definition.requiredContent.length) issues.push({ code: `${definition.type}.missing-required-content`, severity: 'error', message: `${definition.type} is missing required content metadata.` });
    if (!definition.variants.length) issues.push({ code: `${definition.type}.missing-variants`, severity: 'error', message: `${definition.type} is missing variants.` });
    if (!definition.designRules.length) issues.push({ code: `${definition.type}.missing-design-rules`, severity: 'warning', message: `${definition.type} should describe design rules.` });
    if (!definition.compositionRules.length) issues.push({ code: `${definition.type}.missing-composition-rules`, severity: 'warning', message: `${definition.type} should describe composition rules.` });
  }
  return issues;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
