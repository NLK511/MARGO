import type { TenantFrontpageModel } from './frontpage';

export const demoFrontpage: TenantFrontpageModel = {
  tenant: {
    slug: 'bistro-frontpage',
    displayName: 'Bistro Lumiere',
    enabledModules: ['frontpage'],
    themePresetId: 'editorial-bistro',
  },
  page: {
    id: 'demo-home',
    tenantId: 'demo-tenant',
    slug: 'home',
    locale: 'en',
    title: 'Seasonal neighborhood dining',
    seo: { title: 'Seasonal neighborhood dining', description: 'Warm, seasonal cooking in the heart of the city.' },
    status: 'published',
    layoutPreset: 'editorial-bistro',
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
        },
      },
      { id: 'rich', type: 'rich-text', variant: 'default', position: 1, props: { title: 'Our approach', body: 'Fresh local ingredients, concise menus, and a calm dining room for neighborhood regulars.' } },
      { id: 'location', type: 'location', variant: 'card', position: 2, props: { title: 'Find us' } },
      { id: 'contact', type: 'contact-form', variant: 'placeholder', position: 3, props: { title: 'Contact Bistro Lumiere' } },
    ],
  },
};
