import { createCarouselPresetProps } from './carousel-presets';

export type PageBlockType = 'hero' | 'service-list' | 'image' | 'carousel' | 'split-media' | 'rich-text' | 'location' | 'contact-form' | 'cta';

export type PageBlockDefinition = {
  type: PageBlockType;
  label: string;
  description: string;
  intendedUse: string;
  overlapsWith: string[];
  defaultVariant: string;
  createDefaultProps(label: string): Record<string, unknown>;
};

export const pageBlockRegistry: readonly PageBlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Primary above-the-fold section.',
    intendedUse: 'Use once per page as the main entry point and strongest call to action.',
    overlapsWith: ['split-media', 'rich-text'],
    defaultVariant: 'split-image',
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

export function createDefaultPageBlockProps(type: string, label: string): Record<string, unknown> {
  return getPageBlockDefinition(type)?.createDefaultProps(label) ?? { title: label };
}
