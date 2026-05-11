import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedTenant = {
  slug: string;
  legalName: string;
  displayName: string;
  clinicMode: boolean;
  hostname: string;
  modules: string[];
  themePresetId: string;
  layoutConfig: Prisma.InputJsonObject;
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
    layoutConfig: { nav: 'centered', hero: 'full-bleed' },
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
    slug: 'oak-clinic',
    legalName: 'Oak Clinic SELARL',
    displayName: 'Oak Clinic',
    clinicMode: true,
    hostname: 'oak-clinic.localhost',
    modules: ['frontpage', 'notifications', 'booking', 'crm'],
    themePresetId: 'clinical-calm',
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

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: { themePresetId: seed.themePresetId, layoutConfig: seed.layoutConfig },
    create: { tenantId: tenant.id, themePresetId: seed.themePresetId, layoutConfig: seed.layoutConfig },
  });

  await prisma.tenantModule.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenantModule.createMany({
    data: seed.modules.map((moduleId) => ({ tenantId: tenant.id, moduleId, enabled: true })),
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

  const page = await prisma.publicPage.upsert({
    where: { tenantId_locale_slug: { tenantId: tenant.id, locale: 'en', slug: 'home' } },
    update: {
      title: seed.page.title,
      status: 'published',
      seo: { title: seed.page.title, description: seed.page.heroBody },
      layoutPreset: seed.themePresetId,
    },
    create: {
      tenantId: tenant.id,
      locale: 'en',
      slug: 'home',
      title: seed.page.title,
      status: 'published',
      seo: { title: seed.page.title, description: seed.page.heroBody },
      layoutPreset: seed.themePresetId,
    },
  });

  await prisma.pageBlock.deleteMany({ where: { tenantId: tenant.id, pageId: page.id } });
  await prisma.pageBlock.createMany({
    data: [
      {
        tenantId: tenant.id,
        pageId: page.id,
        type: 'hero',
        variant: 'split-image',
        position: 0,
        props: {
          headline: seed.page.heroHeadline,
          body: seed.page.heroBody,
          ctaLabel: seed.page.ctaLabel,
        },
      },
      {
        tenantId: tenant.id,
        pageId: page.id,
        type: 'location',
        variant: 'card',
        position: 1,
        props: { locationName: location.name, address: seed.location.address, phone: seed.location.phone },
      },
    ],
  });

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
}

function deterministicUuid(seed: string, label: string): string {
  const input = `${seed}-${label}`;
  const hex = Buffer.from(input).toString('hex').padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function main() {
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
