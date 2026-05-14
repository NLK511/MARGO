import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { PublicPageBlockRecord, PublicPageLocationRecord, PublicPageRecord, PublicPageServiceRecord } from '@margo/db';
import { compileThemeStyleAttribute, getThemePreset } from '@margo/themes';

export interface TenantFrontpageModel {
  tenant: {
    slug: string;
    displayName: string;
    enabledModules: string[];
    themePresetId: string;
  };
  page: PublicPageRecord;
}

export function FrontpageShell({ model }: { model: TenantFrontpageModel }) {
  const theme = getThemePreset(model.tenant.themePresetId);
  const hasBooking = model.tenant.enabledModules.includes('booking');
  const hasCrm = model.tenant.enabledModules.includes('crm');

  return (
    <main className="frontpage" data-tenant-theme={model.tenant.slug} style={compileThemeStyleAttribute(theme) as CSSProperties}>
      <header className="site-nav" aria-label="Public site navigation">
        <a className="brand" href={`/t/${model.tenant.slug}`}>
          {model.tenant.displayName}
        </a>
        <nav>
          <a href="#services">Services</a>
          <a href="#location">Location</a>
          {hasBooking ? <a href={`/t/${model.tenant.slug}/booking`}>Booking</a> : null}
          {hasCrm ? <a href="/portal">Client portal</a> : null}
        </nav>
      </header>

      <article className="frontpage-content" aria-label={model.page.title}>
        {model.page.blocks.map((block) => (
          <FrontpageBlock key={block.id} block={block} services={model.page.services} locations={model.page.locations} hasBooking={hasBooking} tenantSlug={model.tenant.slug} />
        ))}
      </article>
    </main>
  );
}

export function BrandedMissingPage({ tenantName = 'MARGO' }: { tenantName?: string }) {
  const theme = getThemePreset('clinical-calm');
  return (
    <main className="frontpage missing-page" style={compileThemeStyleAttribute(theme) as CSSProperties}>
      <section className="missing-card">
        <p className="eyebrow">{tenantName}</p>
        <h1>Page not available</h1>
        <p>This page is not published yet or does not exist. Please check the link or return to the homepage.</p>
      </section>
    </main>
  );
}

function FrontpageBlock({
  block,
  services,
  locations,
  hasBooking,
  tenantSlug,
}: {
  block: PublicPageBlockRecord;
  services: PublicPageServiceRecord[];
  locations: PublicPageLocationRecord[];
  hasBooking: boolean;
  tenantSlug: string;
}) {
  const props = toRecord(block.props);

  switch (block.type) {
    case 'hero':
      return (
        <section className={`block hero hero-${block.variant}`}>
          <p className="eyebrow">{stringProp(props, 'eyebrow', 'Welcome')}</p>
          <h1>{stringProp(props, 'headline', 'Welcome')}</h1>
          <p>{stringProp(props, 'body', '')}</p>
          <div className="hero-actions">
            <a className="primary-action" href={hasBooking ? `/t/${tenantSlug}/booking` : '#contact'}>
              {stringProp(props, 'ctaLabel', hasBooking ? 'Book now' : 'Contact us')}
            </a>
          </div>
        </section>
      );
    case 'service-list':
      return (
        <section id="services" className="block section-card">
          <BlockHeading eyebrow="Services" title={stringProp(props, 'title', 'What we offer')} />
          <div className="service-grid">
            {services.map((service) => (
              <article key={service.slug} className="service-card">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <span>{service.durationMinutes} min</span>
              </article>
            ))}
          </div>
        </section>
      );
    case 'location':
      return (
        <section id="location" className="block section-card">
          <BlockHeading eyebrow="Visit" title={stringProp(props, 'title', 'Location and hours')} />
          {locations.map((location) => (
            <article key={location.name} className="location-card">
              <h3>{location.name}</h3>
              <p>{formatAddress(location.address)}</p>
              <p>{location.phone}</p>
              <p>{location.email}</p>
              <p className="muted">Opening hours: Monday to Friday, 09:00–18:00</p>
            </article>
          ))}
        </section>
      );
    case 'cta':
      return (
        <section className="block cta-block">
          <h2>{stringProp(props, 'title', 'Ready to start?')}</h2>
          <p>{stringProp(props, 'body', 'Get in touch with our team today.')}</p>
          <a className="primary-action" href={hasBooking ? `/t/${tenantSlug}/booking` : '#contact'}>
            {stringProp(props, 'label', hasBooking ? 'Book now' : 'Contact us')}
          </a>
        </section>
      );
    case 'rich-text':
      return (
        <section className="block rich-text">
          <h2>{stringProp(props, 'title', 'About')}</h2>
          <p>{stringProp(props, 'body', '')}</p>
        </section>
      );
    case 'contact-form':
      return (
        <section id="contact" className="block section-card contact-placeholder">
          <BlockHeading eyebrow="Contact" title={stringProp(props, 'title', 'Send us a message')} />
          <form aria-label="Contact form placeholder">
            <input disabled placeholder="Your name" />
            <input disabled placeholder="Email" />
            <textarea disabled placeholder="Message" />
            <button type="button" disabled>
              Contact form coming soon
            </button>
          </form>
        </section>
      );
    default:
      return null;
  }
}

function BlockHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="block-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringProp(props: Record<string, unknown>, key: string, fallback: string): string {
  return typeof props[key] === 'string' ? props[key] : fallback;
}

function formatAddress(address: unknown): ReactNode {
  const value = toRecord(address);
  return [value.street, value.city, value.country].filter((part): part is string => typeof part === 'string').join(', ');
}
