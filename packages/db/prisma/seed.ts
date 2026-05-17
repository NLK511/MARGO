import { Prisma, PrismaClient } from '@prisma/client';
import { loadDemoSeedSnapshot, type DemoTenantModuleSettingSnapshot, type DemoTenantSeedSnapshot } from '../src/demo-seed-state';
import { mapLegacyThemePreset, themeCatalog } from '../src/theme-catalog';

const prisma = new PrismaClient() as PrismaClient & {
  quoteRequest: {
    deleteMany(args: unknown): Promise<unknown>;
    create(args: unknown): Promise<unknown>;
  };
};

const demoSeedSnapshot = loadDemoSeedSnapshot();

async function seedThemeCatalog() {
  for (const preset of themeCatalog) {
    const mapping = mapLegacyThemePreset(preset.id);
    await prisma.themeFamily.upsert({
      where: { id: mapping.family.id },
      update: {
        name: mapping.family.name,
        description: mapping.family.description ?? null,
        verticalFit: ['generic'] as Prisma.InputJsonValue,
        personality: mapping.family.personality,
      },
      create: {
        id: mapping.family.id,
        name: mapping.family.name,
        description: mapping.family.description ?? null,
        verticalFit: ['generic'] as Prisma.InputJsonValue,
        personality: mapping.family.personality,
      },
    });
    await prisma.themeVersion.upsert({
      where: { id: mapping.version.id },
      update: {
        themeFamilyId: mapping.family.id,
        version: mapping.version.version,
        lifecycle: mapping.version.lifecycle,
        recipe: mapping.recipe as unknown as Prisma.InputJsonValue,
        migrationNotes: { sourcePresetId: preset.id, migratedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
      create: {
        id: mapping.version.id,
        themeFamilyId: mapping.family.id,
        version: mapping.version.version,
        lifecycle: mapping.version.lifecycle,
        recipe: mapping.recipe as unknown as Prisma.InputJsonValue,
        migrationNotes: { sourcePresetId: preset.id, migratedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

function json<T extends Prisma.InputJsonValue>(value: T): T {
  return value;
}

function createCarouselPresetProps(preset: string, base: Prisma.InputJsonObject = {}): Prisma.InputJsonObject {
  const title = typeof base.title === 'string' && base.title.trim() ? base.title : 'Featured content';
  const eyebrow = typeof base.eyebrow === 'string' && base.eyebrow.trim() ? base.eyebrow : 'Featured';
  const body = typeof base.body === 'string' && base.body.trim() ? base.body : 'A scrollable content carousel.';

  switch (preset) {
    case 'testimonials':
      return {
        eyebrow,
        title,
        body,
        visibleCount: 1,
        scrollMode: 'auto',
        scrollStyle: 'smooth',
        autoAdvanceMs: 3800,
        slides: [
          { eyebrow: 'Dining', title: '“Quiet luxury, perfectly paced”', body: 'A composed dinner with exquisite attention to detail.' },
          { eyebrow: 'Service', title: '“The room feels like an occasion”', body: 'Warm, discreet service without feeling formal.' },
          { eyebrow: 'Private events', title: '“Ideal for a special night”', body: 'An intimate setting for celebrations and business dinners.' },
        ],
      };
    default:
      return {
        eyebrow,
        title,
        body,
        visibleCount: 3,
        scrollMode: 'manual',
        scrollStyle: 'snap',
        autoAdvanceMs: 3200,
        slides: [
          { eyebrow: 'Service', title: 'Featured service', body: 'Highlight one offering with a short description.', ctaLabel: 'Learn more', ctaHref: '#services' },
          { eyebrow: 'Experience', title: 'A second highlight', body: 'Use this slot for another feature or announcement.', ctaLabel: 'Contact us', ctaHref: '#contact' },
        ],
      };
  }
}

type SeedTenant = {
  slug: string;
  legalName: string;
  displayName: string;
  clinicMode: boolean;
  hostname: string;
  modules: string[];
  themePresetId: string;
  layoutPreset: string;
  layoutConfig: Prisma.InputJsonObject;
  branding?: {
    logoUrl?: string;
    faviconUrl?: string;
    themeOverrides?: Prisma.InputJsonObject;
  };
  location: {
    name: string;
    timezone: string;
    address: Prisma.InputJsonObject;
    phone: string;
    email: string;
  };
  page: {
    title: string;
    heroHeadline: string;
    heroBody: string;
    ctaLabel: string;
  };
  services?: Array<{
    slug: string;
    name: string;
    description: string;
    verticalType: string;
    durationMinutes: number;
    priceMinor?: number;
    currency?: string;
  }>;
  resources?: Array<{
    resourceType: string;
    name: string;
    capacity?: number;
  }>;
};

const tenants: SeedTenant[] = [
  {
    slug: 'bistro-frontpage',
    legalName: 'Bistro Lumiere SARL',
    displayName: 'Bistro Lumiere',
    clinicMode: false,
    hostname: 'bistro-frontpage.localhost',
    modules: ['frontpage'],
    themePresetId: 'editorial-bistro',
    layoutPreset: 'editorial',
    layoutConfig: { nav: 'centered', hero: 'full-bleed' },
    branding: {
      logoUrl: '/demo-assets/bistro/logo.svg',
      faviconUrl: '/demo-assets/bistro/favicon.svg',
      themeOverrides: {
        assets: {
          backgroundImageUrl: '/demo-assets/bistro/page-bg.svg',
          cardBackgroundImageUrl: '/demo-assets/bistro/card-bg.svg',
          heroBackgroundImageUrl: '/demo-assets/bistro/hero-bg.svg',
        },
      },
    },
    location: {
      name: 'Bistro Lumiere',
      timezone: 'Europe/Paris',
      address: { street: '12 Rue Demo', city: 'Paris', country: 'FR' },
      phone: '+33100000001',
      email: 'hello@bistrolumiere.example',
    },
    page: {
      title: 'Seasonal neighborhood dining',
      heroHeadline: 'Warm, seasonal cooking in the heart of the city.',
      heroBody: 'A frontpage-only demo tenant showing white-label content and branding without booking or CRM modules.',
      ctaLabel: 'View menu',
    },
  },
  {
    slug: 'table-and-co',
    legalName: 'Table & Co SAS',
    displayName: 'Table & Co',
    clinicMode: false,
    hostname: 'table-and-co.localhost',
    modules: ['frontpage', 'notifications', 'booking'],
    themePresetId: 'editorial-bistro',
    layoutPreset: 'split',
    layoutConfig: { nav: 'centered', hero: 'split-image' },
    location: {
      name: 'Table & Co Main Dining Room',
      timezone: 'Europe/Paris',
      address: { street: '24 Avenue Example', city: 'Lyon', country: 'FR' },
      phone: '+33400000002',
      email: 'bookings@tableandco.example',
    },
    page: {
      title: 'Reserve a table at Table & Co',
      heroHeadline: 'A modern local table for everyday celebrations.',
      heroBody: 'Restaurant demo tenant with public reservations and staff booking operations.',
      ctaLabel: 'Book a table',
    },
    services: [
      {
        slug: 'dinner-reservation',
        name: 'Dinner reservation',
        description: 'Evening table reservation for up to six guests.',
        verticalType: 'restaurant',
        durationMinutes: 90,
      },
      {
        slug: 'lunch-reservation',
        name: 'Lunch reservation',
        description: 'Lunch table reservation.',
        verticalType: 'restaurant',
        durationMinutes: 75,
      },
    ],
    resources: [
      { resourceType: 'table', name: 'Table 1', capacity: 2 },
      { resourceType: 'table', name: 'Table 2', capacity: 4 },
      { resourceType: 'table', name: 'Table 3', capacity: 6 },
    ],
  },
  {
    slug: 'maison-noire',
    legalName: 'Maison Noire SAS',
    displayName: 'Maison Noire',
    clinicMode: false,
    hostname: 'maison-noire.localhost',
    modules: ['frontpage', 'booking', 'notifications', 'quote-request'],
    themePresetId: 'luxury-dark-dining',
    layoutPreset: 'immersive',
    layoutConfig: { nav: 'overlay', hero: 'full-bleed' },
    branding: {
      logoUrl: '/demo-assets/luxury/logo.svg',
      faviconUrl: '/demo-assets/luxury/favicon.svg',
      themeOverrides: {
        assets: {
          backgroundImageUrl: '/demo-assets/luxury/page-bg.svg',
          cardBackgroundImageUrl: '/demo-assets/luxury/card-bg.svg',
          heroBackgroundImageUrl: '/demo-assets/luxury/hero-bg.svg',
        },
      },
    },
    location: {
      name: 'Maison Noire',
      timezone: 'Europe/Paris',
      address: { street: '18 Rue du Faubourg', city: 'Paris', country: 'FR' },
      phone: '+33100000009',
      email: 'reservations@maisonnoire.example',
    },
    page: {
      title: 'An intimate dining room for exceptional evenings',
      heroHeadline: 'Refined tasting menus, low light, and impeccable service.',
      heroBody: 'Luxury restaurant demo tenant with elegant reservations, high-touch branding, and immersive visual styling.',
      ctaLabel: 'Reserve now',
    },
    services: [
      {
        slug: 'tasting-menu',
        name: 'Chef tasting menu',
        description: 'Seasonal tasting menu for two to eight guests.',
        verticalType: 'restaurant',
        durationMinutes: 120,
      },
      {
        slug: 'private-salon',
        name: 'Private salon dinner',
        description: 'Private room dining experience with curated wine pairing.',
        verticalType: 'restaurant',
        durationMinutes: 150,
      },
    ],
    resources: [
      { resourceType: 'table', name: 'Salon A', capacity: 4 },
      { resourceType: 'table', name: 'Salon B', capacity: 6 },
      { resourceType: 'table', name: 'Chef’s Table', capacity: 8 },
    ],
  },
  {
    slug: 'chef',
    legalName: 'Chef Michel Hélène SAS',
    displayName: 'Chef Michel Hélène',
    clinicMode: false,
    hostname: 'chef.localhost',
    modules: ['frontpage', 'booking', 'notifications', 'quote-request'],
    themePresetId: 'chef',
    layoutPreset: 'editorial',
    layoutConfig: {
      nav: 'centered',
      navSticky: true,
      navBrandSlot: 'both',
      navRightText: '06 18 75 47 31',
      navLinks: [
        { label: 'ACCUEIL', href: '/' },
        { label: 'LE CHEF', href: '#about' },
        { label: 'MENUS', href: '#services' },
        { label: 'GALERIE', href: '#gallery' },
        { label: 'PRESSE', href: '#press' },
        { label: 'RÉSERVATION', href: '#reservation' },
      ],
      navSocialLinks: ['https://www.instagram.com/chef_michel_helene/', 'https://www.facebook.com/chefadomicilemichelhelene'],
      hero: 'full-bleed',
      contentWidth: 'wide',
      sectionRhythm: 'spacious',
      sectionBorder: 'thin',
      cardStyle: 'flat',
      headerSpacing: 'margin',
    },
    branding: {
      logoUrl: 'https://chefmichelhelene.com/wp-content/uploads/2025/08/Michel-Helene-noir-scaled.png',
    },
    location: {
      name: 'Chef Michel Hélène',
      timezone: 'Europe/Paris',
      address: { street: 'Paris', city: 'Paris', country: 'FR' },
      phone: '+33618754731',
      email: 'contact@chefmichelhelene.com',
    },
    page: {
      title: 'Chef à domicile à Paris',
      heroHeadline: 'Chef à domicile à Paris',
      heroBody: 'Chef à domicile à Paris pour des dîners d’exception. 17 ans d’expérience en gastronomie, une expérience raffinée et confidentielle.',
      ctaLabel: 'Réservation',
    },
    services: [
      {
        slug: 'menu-degustation',
        name: 'Menu dégustation',
        description: 'Un menu gastronomique sur mesure pour une soirée d’exception.',
        verticalType: 'restaurant',
        durationMinutes: 120,
      },
      {
        slug: 'diner-prive',
        name: 'Dîner privé',
        description: 'Un dîner privé clé en main à domicile ou en réception privée.',
        verticalType: 'restaurant',
        durationMinutes: 150,
      },
      {
        slug: 'reception-privee',
        name: 'Réception privée',
        description: 'Une prestation haut de gamme pour vos événements privés.',
        verticalType: 'restaurant',
        durationMinutes: 180,
      },
    ],
  },
  {
    slug: 'oak-clinic',
    legalName: 'Oak Clinic SELARL',
    displayName: 'Oak Clinic',
    clinicMode: true,
    hostname: 'oak-clinic.localhost',
    modules: ['frontpage', 'notifications', 'booking', 'crm'],
    themePresetId: 'clinical-calm',
    layoutPreset: 'classic',
    layoutConfig: { nav: 'top', hero: 'split-image' },
    location: {
      name: 'Oak Clinic',
      timezone: 'Europe/Paris',
      address: { street: '8 Health Street', city: 'Bordeaux', country: 'FR' },
      phone: '+33500000003',
      email: 'contact@oakclinic.example',
    },
    page: {
      title: 'Calm care for every patient',
      heroHeadline: 'Personalized physiotherapy and wellness care.',
      heroBody: 'Clinic demo tenant with appointments, patient CRM, notes, and timeline events.',
      ctaLabel: 'Book an appointment',
    },
    services: [
      {
        slug: 'initial-consultation',
        name: 'Initial consultation',
        description: 'First appointment with assessment and care plan.',
        verticalType: 'clinic',
        durationMinutes: 45,
        priceMinor: 6500,
        currency: 'EUR',
      },
      {
        slug: 'follow-up',
        name: 'Follow-up appointment',
        description: 'Ongoing care appointment.',
        verticalType: 'clinic',
        durationMinutes: 30,
        priceMinor: 4500,
        currency: 'EUR',
      },
    ],
    resources: [
      { resourceType: 'clinician', name: 'Dr. Ada Martin' },
      { resourceType: 'clinician', name: 'Noah Bernard, PT' },
      { resourceType: 'room', name: 'Treatment room 1' },
    ],
  },
];

async function seedTenant(seed: SeedTenant) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: seed.slug },
    update: {
      legalName: seed.legalName,
      displayName: seed.displayName,
      clinicMode: seed.clinicMode,
    },
    create: {
      slug: seed.slug,
      legalName: seed.legalName,
      displayName: seed.displayName,
      clinicMode: seed.clinicMode,
      primaryLocale: 'en',
      timezone: 'Europe/Paris',
      defaultCurrency: 'EUR',
      plan: 'starter',
    },
  });

  await prisma.domain.upsert({
    where: { hostname: seed.hostname },
    update: { tenantId: tenant.id, status: 'verified', isPrimary: true },
    create: { tenantId: tenant.id, hostname: seed.hostname, status: 'verified', isPrimary: true },
  });

  const tenantSnapshot = demoSeedSnapshot.tenants[seed.slug];
  const brandingSnapshot = tenantSnapshot?.branding;
  const moduleSettingsSnapshot = resolveModuleSettingsSnapshot(seed, tenantSnapshot);

  const themePresetId = brandingSnapshot?.themePresetId ?? seed.themePresetId;
  const themeOverrides = (brandingSnapshot?.themeOverrides ?? seed.branding?.themeOverrides ?? {}) as Prisma.InputJsonValue;

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {
      themePresetId,
      layoutConfig: (brandingSnapshot?.layoutConfig ?? seed.layoutConfig) as Prisma.InputJsonValue,
      logoUrl: brandingSnapshot?.logoUrl ?? seed.branding?.logoUrl,
      faviconUrl: brandingSnapshot?.faviconUrl ?? seed.branding?.faviconUrl,
      themeOverrides,
    },
    create: {
      tenantId: tenant.id,
      themePresetId,
      layoutConfig: (brandingSnapshot?.layoutConfig ?? seed.layoutConfig) as Prisma.InputJsonValue,
      logoUrl: brandingSnapshot?.logoUrl ?? seed.branding?.logoUrl,
      faviconUrl: brandingSnapshot?.faviconUrl ?? seed.branding?.faviconUrl,
      themeOverrides,
    },
  });

  const mapping = mapLegacyThemePreset(themePresetId, themeOverrides as Prisma.InputJsonObject);
  await prisma.tenantThemeAssignment.upsert({
    where: { tenantId: tenant.id },
    update: {
      themeFamilyId: mapping.family.id,
      themeVersionId: mapping.version.id,
      recipeVariation: Object.keys(themeOverrides as Record<string, unknown>).length > 0 ? (themeOverrides as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    },
    create: {
      tenantId: tenant.id,
      themeFamilyId: mapping.family.id,
      themeVersionId: mapping.version.id,
      recipeVariation: Object.keys(themeOverrides as Record<string, unknown>).length > 0 ? (themeOverrides as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    },
  });

  await prisma.tenantModule.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenantModule.createMany({
    data: moduleSettingsSnapshot.map((module) => ({
      tenantId: tenant.id,
      moduleId: module.moduleId,
      enabled: module.enabled ?? true,
      config: (module.config ?? {}) as Prisma.InputJsonValue,
    })),
  });

  const location = await prisma.location.upsert({
    where: { id: deterministicUuid(seed.slug, 'location') },
    update: { ...seed.location, tenantId: tenant.id, active: true },
    create: { id: deterministicUuid(seed.slug, 'location'), tenantId: tenant.id, active: true, ...seed.location },
  });

  const user = await prisma.user.upsert({
    where: { id: deterministicUuid(seed.slug, 'owner') },
    update: { tenantId: tenant.id, email: `owner@${seed.slug}.example`, displayName: `${seed.displayName} Owner` },
    create: {
      id: deterministicUuid(seed.slug, 'owner'),
      tenantId: tenant.id,
      email: `owner@${seed.slug}.example`,
      displayName: `${seed.displayName} Owner`,
    },
  });

  await prisma.roleBinding.deleteMany({ where: { tenantId: tenant.id, userId: user.id } });
  await prisma.roleBinding.create({ data: { tenantId: tenant.id, userId: user.id, role: 'tenant_owner' } });
  await prisma.roleBinding.create({ data: { tenantId: tenant.id, userId: user.id, role: 'tenant_admin' } });

  await prisma.pageBlock.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.publicPage.deleteMany({ where: { tenantId: tenant.id } });

  if (tenantSnapshot?.pages?.length) {
    for (const pageSeed of tenantSnapshot.pages) {
      const page = await prisma.publicPage.create({
        data: {
          tenantId: tenant.id,
          locale: pageSeed.locale,
          slug: pageSeed.slug,
          title: pageSeed.title,
          status: normalizePageStatus(pageSeed.status),
          seo: normalizeJsonObject(pageSeed.seo, { title: pageSeed.title }) as Prisma.InputJsonValue,
          layoutPreset: pageSeed.layoutPreset,
        },
      });

      if (pageSeed.blocks.length) {
        await prisma.pageBlock.createMany({
          data: pageSeed.blocks.map((block) => ({
            tenantId: tenant.id,
            pageId: page.id,
            type: block.type,
            variant: block.variant,
            props: block.props as Prisma.InputJsonValue,
            position: block.position,
          })),
        });
      }
    }
  } else {
    const page = await prisma.publicPage.create({
      data: {
        tenantId: tenant.id,
        locale: 'en',
        slug: 'home',
        title: seed.page.title,
        status: 'published',
        seo: { title: seed.page.title, description: seed.page.heroBody } as Prisma.InputJsonValue,
        layoutPreset: seed.layoutPreset,
      },
    });

    await prisma.pageBlock.createMany({
      data: buildDefaultPageBlocks(seed, tenant.id, page.id, location.name),
    });
  }

  if (seed.services) {
    for (const serviceSeed of seed.services) {
      await prisma.service.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: serviceSeed.slug } },
        update: { ...serviceSeed, tenantId: tenant.id, locationId: location.id, active: true },
        create: { ...serviceSeed, tenantId: tenant.id, locationId: location.id, active: true },
      });
    }
  }

  if (seed.resources) {
    await prisma.resource.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.resource.createMany({
      data: seed.resources.map((resource) => ({ ...resource, tenantId: tenant.id, locationId: location.id, active: true })),
    });
  }

  if (seed.modules.includes('crm')) {
    const customer = await prisma.customer.upsert({
      where: { id: deterministicUuid(seed.slug, 'customer') },
      update: { tenantId: tenant.id, profileKind: 'patient', displayName: 'Demo Patient', email: 'patient@oakclinic.example' },
      create: {
        id: deterministicUuid(seed.slug, 'customer'),
        tenantId: tenant.id,
        profileKind: 'patient',
        firstName: 'Demo',
        lastName: 'Patient',
        displayName: 'Demo Patient',
        email: 'patient@oakclinic.example',
      },
    });

    await prisma.customerNote.deleteMany({ where: { tenantId: tenant.id, customerId: customer.id } });
    await prisma.customerNote.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        authorUserId: user.id,
        body: 'Seed note for clinic CRM demo.',
      },
    });
  }

  if (seed.modules.includes('quote-request')) {
    await prisma.quoteRequest.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.quoteRequest.create({
      data: {
        tenantId: tenant.id,
        publicToken: `${seed.slug}-quote-demo`,
        status: 'submitted',
        outputMode: 'quote',
        recipientEmail: seed.location.email,
        requesterName: 'Demo Event Planner',
        requesterEmail: 'planner@example.test',
        requesterPhone: '+33111222333',
        requesterCompany: 'Maison Noire Events',
        answers: json({ event_type: 'corporate-reception', guest_count: 24, service_level: 'full-experience' }),
        quoteBreakdown: json([
          { label: 'Base quote', kind: 'base', amountMinor: 12000 },
          { label: 'What are you planning?: Corporate reception', kind: 'option', amountMinor: 25000 },
          { label: 'How many guests?: Additional guest setup', kind: 'rule', amountMinor: 1500 },
          { label: 'Preferred service level: Full private experience', kind: 'option', amountMinor: 22000 },
        ]),
        quoteMinor: 60500,
        currency: 'EUR',
        configSnapshot: json({ title: 'Request a private quote', outputMode: 'quote', successTitle: 'Request received', successBody: 'Thank you. Our team will review the details and email you shortly.' }),
      },
    });
  }
}

function buildDefaultPageBlocks(seed: SeedTenant, tenantId: string, pageId: string, locationName: string) {
  if (seed.slug === 'chef') {
    return buildChefPageBlocks(tenantId, pageId, locationName);
  }

  return [
    {
      tenantId,
      pageId,
      type: 'hero',
      variant: 'split-image',
      position: 0,
      props: json({
        headline: seed.page.heroHeadline,
        body: seed.page.heroBody,
        ctaLabel: seed.page.ctaLabel,
      }) as Prisma.InputJsonValue,
    },
    ...(seed.slug === 'maison-noire'
      ? [
          {
            tenantId,
            pageId,
            type: 'carousel',
            variant: 'testimonials',
            position: 1,
            props: json(createCarouselPresetProps('testimonials', {
              eyebrow: 'Guest notes',
              title: 'A few reasons guests return',
              body: 'A premium carousel preset for polished social proof and memorable touches.',
            })) as Prisma.InputJsonValue,
          },
        ]
      : []),
    {
      tenantId,
      pageId,
      type: 'rich-text',
      variant: 'default',
      position: seed.slug === 'maison-noire' ? 2 : 1,
      props: json({ title: 'About us', body: seed.page.heroBody }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'service-list',
      variant: 'cards',
      position: seed.slug === 'maison-noire' ? 3 : 2,
      props: json({ title: seed.services?.length ? 'Services' : 'Highlights' }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'location',
      variant: 'card',
      position: seed.slug === 'maison-noire' ? 4 : 3,
      props: json({ locationName: locationName, address: seed.location.address, phone: seed.location.phone }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: seed.modules.includes('booking') ? 'cta' : 'contact-form',
      variant: seed.modules.includes('booking') ? 'banner' : 'placeholder',
      position: seed.slug === 'maison-noire' ? 5 : 4,
      props: seed.modules.includes('booking')
        ? (json({ title: seed.page.ctaLabel, body: 'Choose a convenient time online.', label: seed.page.ctaLabel }) as Prisma.InputJsonValue)
        : (json({ title: 'Contact us' }) as Prisma.InputJsonValue),
    },
  ];
}

function buildChefPageBlocks(tenantId: string, pageId: string, locationName: string) {
  return [
    {
      tenantId,
      pageId,
      type: 'hero',
      variant: 'split-image',
      position: 0,
      props: json({
        eyebrow: 'Chef à domicile à Paris',
        headline: 'Chef à domicile à Paris',
        body: 'Chef à domicile à Paris pour des dîners d’exception. 17 ans d’expérience en gastronomie, une expérience raffinée et confidentielle.',
        ctaLabel: 'Réservation',
        secondaryLabel: 'Découvrir le chef',
        secondaryHref: '#about',
        panelLabel: 'Service privé',
        panelTitle: 'Un chef privé à votre service, chez vous ou lors de vos réceptions privées',
        panelBody: 'Une cuisine d’exception, discrète et sur-mesure, pensée pour les moments importants.',
        highlights: ['Menus gastronomiques', 'Service clé en main', 'Paris et île-de-France'],
        panelMeta: ['17 ans d’expérience', 'Chef privé'],
        backgroundImage: 'https://chefmichelhelene.com/wp-content/uploads/2023/12/Chef_a_Domicile_Paris.jpg',
      }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'rich-text',
      variant: 'default',
      position: 1,
      props: json({
        title: 'Le déroulement de votre dîner privé clé en main',
        body: 'De la préparation au service, tout est orchestré pour vous laisser profiter pleinement de votre soirée.',
      }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'split-media',
      variant: 'image-right',
      position: 2,
      props: json({
        title: 'Le chef',
        body: 'Cuisine discrète, précision des cuissons et soin du détail pour une expérience intime et haut de gamme.',
        imageUrl: 'https://chefmichelhelene.com/wp-content/uploads/2024/02/Chef_Michel_Helene.jpg',
        alt: 'Chef Michel Hélène',
      }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'service-list',
      variant: 'cards',
      position: 3,
      props: json({ title: 'Menus gastronomiques à domicile à Paris' }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'carousel',
      variant: 'testimonials',
      position: 4,
      props: json(createCarouselPresetProps('testimonials', {
        eyebrow: 'Une expérience saluée par mes clients',
        title: 'Une expérience saluée par mes clients',
        body: 'Moments partagés autour de la gastronomie.',
      })) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'image',
      variant: 'cover',
      position: 5,
      props: json({
        caption: 'Moments partagés autour de la gastronomie',
        imageUrl: 'https://chefmichelhelene.com/wp-content/uploads/2024/07/presentationviande_chefMichelHelene-scaled.jpg',
        buttonLabel: 'Voir la galerie',
        buttonHref: '#gallery',
      }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'rich-text',
      variant: 'default',
      position: 6,
      props: json({
        title: 'Moments partagés autour de la gastronomie',
        body: 'Une présence presse, des maisons partenaires et des clients qui reviennent pour l’expérience.',
      }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'location',
      variant: 'card',
      position: 7,
      props: json({ locationName: locationName, title: 'Dîners privés et prestations à domicile' }) as Prisma.InputJsonValue,
    },
    {
      tenantId,
      pageId,
      type: 'cta',
      variant: 'banner',
      position: 8,
      props: json({
        title: 'Réservez votre prochain dîner avec un chef à domicile à Paris',
        body: 'Contactez-nous pour imaginer une prestation sur mesure.',
        label: 'Réservation',
      }) as Prisma.InputJsonValue,
    },
  ];
}

function resolveModuleSettingsSnapshot(
  seed: SeedTenant,
  tenantSnapshot?: DemoTenantSeedSnapshot,
): DemoTenantModuleSettingSnapshot[] {
  const defaults = seed.modules.map((moduleId) => ({
    moduleId,
    enabled: true,
    config: moduleId === 'quote-request' ? createDefaultQuoteRequestConfig() : {},
  }));

  const snapshotModuleSettings = tenantSnapshot?.moduleSettings ?? [];
  const snapshotByModuleId = new Map(snapshotModuleSettings.map((module) => [module.moduleId, module] as const));
  const merged = defaults.map((module) => {
    const snapshotModule = snapshotByModuleId.get(module.moduleId);
    return snapshotModule
      ? {
          moduleId: module.moduleId,
          enabled: snapshotModule.enabled ?? module.enabled,
          config: snapshotModule.config ?? module.config ?? {},
        }
      : module;
  });

  const extraSnapshotModules = snapshotModuleSettings.filter((module) => !defaults.some((defaultModule) => defaultModule.moduleId === module.moduleId));
  const quoteRequestSnapshot = tenantSnapshot?.quoteRequest;
  if (quoteRequestSnapshot && !snapshotByModuleId.has('quote-request')) {
    extraSnapshotModules.push({
      moduleId: 'quote-request',
      enabled: quoteRequestSnapshot.enabled ?? true,
      config: quoteRequestSnapshot.config ?? {},
    });
  }

  return [...merged, ...extraSnapshotModules];
}

function createDefaultQuoteRequestConfig(): Record<string, unknown> {
  return {
    title: 'Request a private quote',
    intro: 'Answer a few questions and the Maison Noire team will reply with a tailored proposal.',
    recipientEmail: 'reservations@maisonnoire.example',
    outputMode: 'quote',
    currency: 'EUR',
    basePriceMinor: 12000,
    estimatedLabel: 'Estimated quote',
    successTitle: 'Request received',
    successBody: 'Thank you. Our team will review the details and email you shortly.',
    leadFields: [
      { key: 'displayName', label: 'Full name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'message', label: 'Notes', type: 'textarea' },
    ],
    questions: [
      {
        id: 'event_type',
        label: 'What are you planning?',
        type: 'select',
        required: true,
        options: [
          { label: 'Private dinner', value: 'private-dinner', priceMinor: 0 },
          { label: 'Corporate reception', value: 'corporate-reception', priceMinor: 25000 },
          { label: 'Celebration', value: 'celebration', priceMinor: 18000 },
        ],
      },
      {
        id: 'guest_count',
        label: 'How many guests?',
        type: 'number',
        required: true,
        pricingRules: [{ id: 'guest-count', kind: 'add', amountMinor: 1500, note: 'Additional guest setup per person' }],
      },
      {
        id: 'service_level',
        label: 'Preferred service level',
        type: 'radio',
        options: [
          { label: 'Dinner only', value: 'dinner-only', priceMinor: 0 },
          { label: 'Dinner + wine pairing', value: 'wine-pairing', priceMinor: 9000 },
          { label: 'Full private experience', value: 'full-experience', priceMinor: 22000 },
        ],
      },
    ],
  };
}

function normalizePageStatus(value: string): 'draft' | 'published' {
  return value === 'published' ? 'published' : 'draft';
}

function normalizeJsonObject(value: Record<string, unknown> | undefined, fallback: Record<string, unknown>): Record<string, unknown> {
  return value && Object.keys(value).length > 0 ? value : fallback;
}

function deterministicUuid(seed: string, label: string): string {
  const input = `${seed}-${label}`;
  const hex = Buffer.from(input).toString('hex').padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function main() {
  await seedThemeCatalog();

  for (const tenant of tenants) {
    await seedTenant(tenant);
  }

  console.log(`Seeded ${tenants.length} MVP tenants.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
