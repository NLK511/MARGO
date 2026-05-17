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

export const maisonNoireDemoFrontpage: TenantFrontpageModel = {
  tenant: {
    slug: 'maison-noire',
    locale: 'en',
    displayName: 'Maison Noire',
    enabledModules: ['frontpage', 'booking', 'notifications', 'quote-request'],
    themePresetId: 'luxury-dark-dining',
    layoutConfig: {
      nav: 'overlay',
      navSticky: false,
      hero: 'full-bleed',
      contentWidth: 'full',
      sectionRhythm: 'spacious',
      sectionBorder: 'none',
      cardStyle: 'glass',
      cardRadius: 'round',
    },
    themeOverrides: {
      assets: {
        backgroundImageUrl: '/demo-assets/luxury/page-bg.svg',
        cardBackgroundImageUrl: '/demo-assets/luxury/card-bg.svg',
        heroBackgroundImageUrl: '/demo-assets/luxury/hero-bg.svg',
      },
    },
    logoUrl: '/demo-assets/luxury/logo.svg',
    faviconUrl: '/demo-assets/luxury/favicon.svg',
  },
  page: {
    id: 'demo-home-maison-noire',
    tenantId: 'demo-maison-noire',
    slug: 'home',
    locale: 'en',
    title: 'An intimate dining room for exceptional evenings',
    seo: { title: 'An intimate dining room for exceptional evenings', description: 'Luxury restaurant demo tenant with elegant reservations and immersive visual styling.' },
    status: 'published',
    layoutPreset: 'immersive',
    services: [],
    locations: [
      {
        name: 'Maison Noire',
        address: { street: '18 Rue du Faubourg', city: 'Paris', country: 'FR' },
        phone: '+33100000009',
        email: 'reservations@maisonnoire.example',
      },
    ],
    blocks: [
      {
        id: 'hero',
        type: 'hero',
        variant: 'split-image',
        position: 0,
        props: {
          eyebrow: 'Maison Noire',
          headline: 'Refined tasting menus, low light, and impeccable service.',
          body: 'Luxury restaurant demo tenant with elegant reservations, high-touch branding, and immersive visual styling.',
          ctaLabel: 'Reserve now',
          secondaryLabel: 'Explore the menu',
          secondaryHref: '#services',
          panelLabel: 'Dining room',
          panelTitle: 'An intimate evening venue',
          panelBody: 'A dark, editorial public page with flexible blocks and layered visuals.',
          highlights: ['Chef tasting menu', 'Private salon dinners', 'Seasonal wine pairings'],
          panelMeta: ['Paris 1er', 'Open evenings'],
        },
      },
      {
        id: 'carousel',
        type: 'carousel',
        variant: 'testimonials',
        position: 1,
        props: createCarouselPresetProps('testimonials', {
          eyebrow: 'Guest notes',
          title: 'A few reasons guests return',
          body: 'A premium carousel preset for polished social proof and memorable touches.',
        }) as never,
      },
      { id: 'rich', type: 'rich-text', variant: 'default', position: 2, props: { title: 'About us', body: 'An intimate room for exceptional evenings.' } },
      { id: 'location', type: 'location', variant: 'card', position: 3, props: { title: 'Find us' } },
      { id: 'contact', type: 'cta', variant: 'banner', position: 4, props: { title: 'Reserve now', body: 'Choose a convenient time online.', label: 'Reserve now' } },
    ],
  },
};
export function getDemoFrontpageModel(tenantSlug: string): TenantFrontpageModel | null {
  if (tenantSlug === 'maison-noire') return maisonNoireDemoFrontpage;
  if (tenantSlug === 'bistro-frontpage') return demoFrontpage;
  return null;
}
