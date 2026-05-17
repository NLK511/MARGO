import { createCarouselPresetProps } from '@margo/core';
import type { TenantFrontpageModel } from './frontpage';

export const demoFrontpage: TenantFrontpageModel = {
  tenant: {
    slug: 'bistro-frontpage',
    locale: 'en',
    displayName: 'Bistro Lumiere',
    enabledModules: ['frontpage'],
    themePresetId: 'editorial-bistro',
    layoutConfig: {
      nav: 'centered',
      navSticky: true,
      hero: 'full-bleed',
      contentWidth: 'wide',
      sectionRhythm: 'spacious',
      sectionBorder: 'thin',
      cardStyle: 'flat',
    },
  },
  page: {
    id: 'demo-home',
    tenantId: 'demo-tenant',
    slug: 'home',
    locale: 'en',
    title: 'Seasonal neighborhood dining',
    seo: { title: 'Seasonal neighborhood dining', description: 'Warm, seasonal cooking in the heart of the city.' },
    status: 'published',
    layoutPreset: 'editorial',
    services: [],
    locations: [
      {
        name: 'Bistro Lumiere',
        address: { street: '12 Rue Demo', city: 'Paris', country: 'FR' },
        phone: '+33100000001',
        email: 'hello@bistrolumiere.example',
      },
    ],
    blocks: [
      {
        id: 'hero',
        type: 'hero',
        variant: 'split-image',
        position: 0,
        props: {
          eyebrow: 'Public web',
          headline: 'Warm, seasonal cooking in the heart of the city.',
          body: 'A frontpage-only demo tenant showing white-label content and branding without booking or CRM links.',
          ctaLabel: 'View menu',
          secondaryLabel: 'Explore services',
          secondaryHref: '#services',
          panelLabel: 'Dining room',
          panelTitle: 'Refined, calm, and bookable',
          panelBody: 'A quieter editorial presentation that keeps content blocks fully customizable.',
          highlights: ['Seasonal menu', 'Local ingredients', 'Private dining available'],
          panelMeta: ['Open daily', 'Paris 2e'],
        },
      },
      {
        id: 'carousel',
        type: 'carousel',
        variant: 'cards',
        position: 1,
        props: createCarouselPresetProps('cards', {
          eyebrow: 'Highlights',
          title: 'Featured dishes and moments',
          body: 'A carousel preset for editorial highlights, promos, or collections.',
        }) as never,
      },
      { id: 'image', type: 'image', variant: 'cover', position: 2, props: { caption: 'A seasonal visual block.', imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'View gallery', buttonHref: '/gallery' } },
      { id: 'split-media', type: 'split-media', variant: 'image-right', position: 3, props: { title: 'Our approach', body: 'Fresh local ingredients, concise menus, and a calm dining room for neighborhood regulars.', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book a table', buttonHref: '#contact' } },
      { id: 'rich', type: 'rich-text', variant: 'default', position: 4, props: { title: 'Our approach', body: 'Fresh local ingredients, concise menus, and a calm dining room for neighborhood regulars.' } },
      { id: 'location', type: 'location', variant: 'card', position: 5, props: { title: 'Find us' } },
      { id: 'contact', type: 'contact-form', variant: 'placeholder', position: 6, props: { title: 'Contact Bistro Lumiere' } },
    ],
  },
};
