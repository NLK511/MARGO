import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { CarouselBlock } from './carousel-block';
import type { PublicPageBlockRecord, PublicPageLocationRecord, PublicPageRecord, PublicPageServiceRecord } from '@margo/db';
import { getCarouselPresetDefaults, getCarouselPresetSlides } from '@margo/core';
import { compileThemeStyleAttribute, createThemeRuntimeSurface, getThemePreset, mergeTheme, resolveThemePresetOrFallback, type ThemeOverrides } from '@margo/themes';

export interface TenantFrontpageModel {
  tenant: {
    slug: string;
    locale?: string;
    displayName: string;
    enabledModules: string[];
    themePresetId: string;
    layoutConfig?: Record<string, unknown>;
    themeOverrides?: Record<string, unknown>;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    homeHref?: string;
  };
  page: PublicPageRecord;
}

export function FrontpageShell({ model }: { model: TenantFrontpageModel }) {
  const baseTheme = resolveThemePresetOrFallback(model.tenant.themePresetId, (warning) => console.warn(warning)).preset;
  const themeOverrides = normalizeThemeOverrides(model.tenant.themeOverrides);
  const layoutConfig = toRecord(model.tenant.layoutConfig);
  const blockDefaults = toRecord(layoutConfig.blockDefaults);
  const theme = mergeTheme(baseTheme, themeOverrides);
  const runtimeLayout = {
    ...theme.layout,
    ...themeOverrides.layout,
    ...normalizeLayoutOverrides(layoutConfig),
    template: theme.layout.template,
  };
  const runtimeTheme = { ...theme, layout: runtimeLayout };
  const runtimeSurface = createThemeRuntimeSurface(runtimeTheme);
  const navVariant = stringRecordProp(layoutConfig, 'nav', runtimeLayout.nav);
  const heroVariant = stringRecordProp(layoutConfig, 'hero', runtimeLayout.hero);
  const contentWidth = stringRecordProp(layoutConfig, 'contentWidth', runtimeLayout.contentWidth);
  const sectionRhythm = stringRecordProp(layoutConfig, 'sectionRhythm', runtimeLayout.sectionRhythm);
  const sectionBorder = stringRecordProp(layoutConfig, 'sectionBorder', runtimeLayout.sectionBorder);
  const cardStyle = stringRecordProp(layoutConfig, 'cardStyle', runtimeLayout.cardStyle);
  const cardRadius = stringRecordProp(layoutConfig, 'cardRadius', runtimeLayout.cardRadius);
  const navSticky = booleanRecordProp(layoutConfig, 'navSticky', runtimeLayout.navSticky);
  const navHeight = stringRecordProp(layoutConfig, 'navHeight', 'regular');
  const navTransparency = stringRecordProp(layoutConfig, 'navTransparency', 'glass');
  const headerSpacing = stringRecordProp(layoutConfig, 'headerSpacing', 'margin');
  const navUnderlineHover = booleanRecordProp(layoutConfig, 'navUnderlineHover', true);
  const navBrandSlot = stringRecordProp(layoutConfig, 'navBrandSlot', 'logo');
  const navRightText = stringRecordProp(layoutConfig, 'navRightText', '');
  const hasBooking = model.tenant.enabledModules.includes('booking');
  const hasCrm = model.tenant.enabledModules.includes('crm');
  const navLinks = navItemsRecordProp(layoutConfig, 'navLinks', defaultNavLinks(model.tenant.slug, hasBooking, hasCrm));
  const navSocialLinks = socialItemsRecordProp(layoutConfig, 'navSocialLinks', []);
  const logotype = stringRecordProp(layoutConfig, 'logotype', model.tenant.displayName);
  const menuDefaults = toRecord(layoutConfig.menuDefaults);
  const menuStyle = resolveTextAndSpacingStyle(menuDefaults, menuDefaults, {
    fontFamily: runtimeTheme.typography.fontBody ?? runtimeTheme.typography.fontSans,
    color: runtimeTheme.typography.fontBodyColor ?? runtimeTheme.typography.fontSansColor ?? runtimeTheme.colors.text,
    fontSize: '0.95rem',
    lineHeight: '1.45',
    margin: '',
    padding: '',
  });
  delete (menuStyle as Record<string, unknown>).margin;
  setCssVar(menuStyle as Record<string, string>, '--menu-item-gap', resolveCssLength(menuDefaults.itemGap as string | undefined, '14px'));

  return (
    <main
      className={`frontpage ${runtimeSurface.className}`}
      data-tenant-theme={model.tenant.slug}
      data-layout-preset={runtimeSurface.dataAttributes['data-layout-template']}
      data-hero-variant={heroVariant}
      data-card-style={cardStyle}
      data-card-radius={cardRadius}
      data-header-spacing={headerSpacing}
      data-nav-height={navHeight}
      {...runtimeSurface.dataAttributes}
      style={runtimeSurface.style as CSSProperties}
    >
      <header
        className={`site-nav site-nav--${navVariant}`}
        aria-label="Public site navigation"
        data-nav-sticky={navSticky ? 'true' : 'false'}
        data-nav-height={navHeight}
        data-nav-transparency={navTransparency}
        data-nav-underline-hover={navUnderlineHover ? 'true' : 'false'}
        data-nav-brand-slot={navBrandSlot}
        style={menuStyle}
      >
        <a className="brand" href={model.tenant.homeHref ?? (model.tenant.locale ? `/${model.tenant.locale}` : `/t/${model.tenant.slug}`)}>
          {(navBrandSlot === 'logo' || navBrandSlot === 'both') && model.tenant.logoUrl ? <img className="brand-mark" src={model.tenant.logoUrl} alt="" aria-hidden="true" /> : <span className="brand-mark brand-mark-placeholder">{model.tenant.displayName.slice(0, 1)}</span>}
          {navBrandSlot !== 'logo' ? (
            <span className="brand-copy">
              <span className="brand-logotype">{logotype}</span>
              <span className="brand-subtitle">{model.tenant.displayName}</span>
            </span>
          ) : null}
        </a>
        <nav className="site-nav-links" aria-label="Primary navigation">
          {navLinks.map((item) => (
            <a key={`${item.label}-${item.href}`} href={item.href || '#'}>
              {item.label || 'Link'}
            </a>
          ))}
        </nav>
        <div className="site-nav-aside">
          {navRightText ? <p className="site-nav-text">{navRightText}</p> : null}
          <div className="site-nav-socials" aria-label="Social links">
            {navSocialLinks.map((item) => (
              <a key={item.href} href={item.href || '#'} aria-label={inferSocialLabel(item.href)} title={inferSocialLabel(item.href)}>
                <span aria-hidden="true">{inferSocialIcon(item.href)}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <article className="frontpage-content" aria-label={model.page.title} data-section-rhythm={sectionRhythm} data-content-width={contentWidth} data-section-border={sectionBorder}>
        {model.page.blocks.map((block) => (
          <FrontpageBlock
            key={block.id}
            block={block}
            services={model.page.services}
            locations={model.page.locations}
            hasBooking={hasBooking}
            tenantSlug={model.tenant.slug}
            blockDefaults={blockDefaults}
          />
        ))}
      </article>
    </main>
  );
}

export function BrandedMissingPage({ tenantName = 'MARGO' }: { tenantName?: string }) {
  const theme = getThemePreset('clinical-calm');
  return (
    <main className="frontpage missing-page" data-header-spacing="margin" style={compileThemeStyleAttribute(theme) as CSSProperties}>
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
  blockDefaults,
}: {
  block: PublicPageBlockRecord;
  services: PublicPageServiceRecord[];
  locations: PublicPageLocationRecord[];
  hasBooking: boolean;
  tenantSlug: string;
  blockDefaults: Record<string, unknown>;
}) {
  const props = toRecord(block.props);
  const blockStyle = resolveBlockStyle(props, blockDefaults);

  switch (block.type) {
    case 'hero': {
      const highlights = stringArrayProp(props, 'highlights');
      const panelMeta = stringArrayProp(props, 'panelMeta');
      const heroImage = stringProp(props, 'backgroundImage', '');
      return (
        <section className={`block hero hero-${block.variant}`} data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          <div className="hero-copy">
            <p className="eyebrow">{stringProp(props, 'eyebrow', 'Welcome')}</p>
            <h1>{stringProp(props, 'headline', 'Welcome')}</h1>
            {stringProp(props, 'body', '') ? <p>{stringProp(props, 'body', '')}</p> : null}
            {renderBlockActions(props, {
              primaryLabel: stringProp(props, 'ctaLabel', hasBooking ? 'Book now' : 'Contact us'),
              primaryHref: hasBooking ? `/t/${tenantSlug}/booking` : '#contact',
              secondaryLabel: stringProp(props, 'secondaryLabel', ''),
              secondaryHref: stringProp(props, 'secondaryHref', '#services'),
            })}
          </div>

          <aside className="hero-panel" aria-label="Highlights">
            <p className="hero-panel-label">{stringProp(props, 'panelLabel', 'At a glance')}</p>
            <h2>{stringProp(props, 'panelTitle', 'A calmer way to arrive')}</h2>
            <p>{stringProp(props, 'panelBody', 'Elegant public pages with clear navigation, strong hierarchy, and soft motion.')}</p>
            {heroImage ? <div className="hero-panel-image" style={{ backgroundImage: `url('${escapeCssUrl(heroImage)}')` }} aria-hidden="true" /> : null}
            {highlights.length ? (
              <ul className="hero-highlights">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {panelMeta.length ? <p className="hero-panel-meta">{panelMeta.join(' · ')}</p> : null}
          </aside>
        </section>
      );
    }
    case 'service-list': {
      const titleStyle = resolveTitleStyle(props);
      return (
        <section id="services" className="block section-card" data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          <BlockHeading title={stringProp(props, 'title', 'What we offer')} titleStyle={titleStyle} />
          {services.length ? (
            <div className="service-grid">
              {services.map((service) => (
                <article key={service.slug} className="service-card">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <span>{service.durationMinutes} min</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <h3>No services yet</h3>
              <p>Add services in the tenant builder to show them here.</p>
            </div>
          )}
          {renderBlockActions(props)}
        </section>
      );
    }
    case 'carousel': {
      const title = stringProp(props, 'title', 'Featured content');
      return (
        <CarouselBlock
          styleVars={blockStyle}
          title={title}
          body={stringProp(props, 'body', '') || undefined}
          preset={block.variant}
          visibleCount={carouselVisibleCount(props, block.variant)}
          mode={carouselMode(props, block.variant)}
          style={carouselStyle(props, block.variant)}
          autoAdvanceMs={carouselAutoAdvanceMs(props, block.variant)}
          slides={carouselSlidesProp(props, block.variant)}
          actions={blockActionList(props)}
        />
      );
    }
    case 'location': {
      const titleStyle = resolveTitleStyle(props);
      return (
        <section id="location" className="block section-card" data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          <BlockHeading title={stringProp(props, 'title', 'Location and hours')} titleStyle={titleStyle} />
          {locations.length ? (
            <div className="location-grid">
              {locations.map((location) => (
                <article key={location.name} className="location-card">
                  <h3>{location.name}</h3>
                  <p>{formatAddress(location.address)}</p>
                  <p>{location.phone}</p>
                  <p>{location.email}</p>
                  <p className="muted">Opening hours: Monday to Friday, 09:00–18:00</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <h3>No locations yet</h3>
              <p>Add a location in the tenant builder to show address and hours here.</p>
            </div>
          )}
          {renderBlockActions(props)}
        </section>
      );
    }
    case 'image': {
      const imageUrl = stringProp(props, 'imageUrl', '');
      const fit = block.variant === 'framed' ? 'framed' : 'cover';
      const overlays = groupImageOverlayItems(imageOverlayItemsProp(props));
      const button = imageButtonProp(props, blockStyle);
      const blockStyleWithoutSpacing = fit === 'cover' ? stripBlockSpacing(blockStyle) : blockStyle;
      const imageGutter = resolveBlockGutter(blockStyle);
      return (
        <section
          className={`block image-block image-block-${fit}`}
          data-block-id={block.id}
          data-block-type={block.type}
          data-image-fit={fit}
          style={{ ...(blockStyleWithoutSpacing as CSSProperties), '--image-block-gutter': imageGutter ?? '18px' } as CSSProperties}
        >
          <figure className="image-block-figure">
            <div className="image-block-shell">
              <div className="image-block-frame" style={imageUrl ? { backgroundImage: `url('${escapeCssUrl(imageUrl)}')` } : undefined} aria-hidden="true" />
              {overlays.length ? (
                <div className="image-block-overlays" aria-label={stringProp(props, 'alt', stringProp(props, 'caption', 'Image overlays'))}>
                  {overlays.map((slot) => (
                    <div key={slot.position} className={`image-block-overlay-slot image-block-overlay-${slot.position}`}>
                      {slot.items.map((overlay, index) => renderImageOverlay(overlay, index))}
                    </div>
                  ))}
                </div>
              ) : null}
              {button ? (
                <a className={`image-block-button image-block-button--${button.position} image-block-button--${button.variant}`} href={button.href} style={button.style}>
                  {button.label}
                </a>
              ) : null}
            </div>
            {stringProp(props, 'caption', '') ? <figcaption>{stringProp(props, 'caption', '')}</figcaption> : null}
          </figure>
        </section>
      );
    }
    case 'split-media': {
      const mediaSide = stringProp(props, 'mediaSide', 'image-left');
      const mediaType = stringProp(props, 'mediaType', stringProp(props, 'videoUrl', '') ? 'video' : 'image');
      const imageUrl = stringProp(props, 'imageUrl', '');
      const videoUrl = stringProp(props, 'videoUrl', '');
      const textStyle = resolveTextAndSpacingStyle(toRecord(props.textStyle), toRecord(props.textSpacing), {
        fontFamily: blockStyle.fontFamily as string | undefined,
        color: blockStyle.color as string | undefined,
        fontSize: blockStyle.fontSize as string | undefined,
        lineHeight: blockStyle.lineHeight as string | undefined,
        margin: '',
        padding: '',
        interline: blockStyle.lineHeight as string | undefined,
      });
      const mediaStyle = resolveSpacingOnlyStyle({ spacing: toRecord(props.mediaSpacing) }, { margin: '', padding: '' });
      const titleStyle = resolveTitleStyle(props);
      const textTitle = stringProp(props, 'textTitle', stringProp(props, 'title', 'A split media block'));
      const media = (
        <div className="split-media-visual" aria-hidden={stringProp(props, 'alt', '') ? 'false' : 'true'} style={{ ...(mediaStyle as CSSProperties), ...(mediaType !== 'video' && imageUrl ? { backgroundImage: `url('${escapeCssUrl(imageUrl)}')` } : {}) }}>
          {mediaType === 'video' && videoUrl ? <video src={videoUrl} muted playsInline loop controls={false} autoPlay /> : null}
          {stringProp(props, 'alt', '') ? <span className="sr-only">{stringProp(props, 'alt', '')}</span> : null}
        </div>
      );
      const text = (
        <div className="split-media-copy" style={textStyle}>
          <h2 style={titleStyle}>{textTitle}</h2>
          {stringProp(props, 'body', '') ? <p>{stringProp(props, 'body', '')}</p> : null}
          {renderBlockActions(props)}
        </div>
      );
      return (
        <section className={`block split-media-block split-media-${mediaSide}`} data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          {mediaSide === 'image-right' ? text : media}
          {mediaSide === 'image-right' ? media : text}
        </section>
      );
    }
    case 'cta': {
      const titleStyle = resolveTitleStyle(props);
      return (
        <section className="block cta-block" data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          <h2 style={titleStyle}>{stringProp(props, 'title', 'Ready to start?')}</h2>
          <p>{stringProp(props, 'body', 'Get in touch with our team today.')}</p>
          {renderBlockActions(props, { primaryLabel: stringProp(props, 'label', hasBooking ? 'Book now' : 'Contact us'), primaryHref: hasBooking ? `/t/${tenantSlug}/booking` : '#contact' })}
        </section>
      );
    }
    case 'rich-text': {
      const titleStyle = resolveTitleStyle(props);
      return (
        <section className="block rich-text" data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          <h2 style={titleStyle}>{stringProp(props, 'title', 'About')}</h2>
          <p>{stringProp(props, 'body', '')}</p>
          {renderBlockActions(props)}
        </section>
      );
    }
    case 'contact-form': {
      const titleStyle = resolveTitleStyle(props);
      return (
        <section id="contact" className="block section-card contact-placeholder" data-block-id={block.id} data-block-type={block.type} style={blockStyle}>
          <BlockHeading title={stringProp(props, 'title', 'Send us a message')} titleStyle={titleStyle} />
          <form aria-label="Contact form placeholder">
            <input disabled placeholder="Your name" />
            <input disabled placeholder="Email" />
            <textarea disabled placeholder="Message" />
            <button type="button" disabled>
              Contact form coming soon
            </button>
          </form>
          {renderBlockActions(props)}
        </section>
      );
    }
    default:
      return null;
  }
}

function BlockHeading({ eyebrow, title, titleStyle }: { eyebrow?: string; title: string; titleStyle?: CSSProperties }) {
  return (
    <div className="block-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 style={titleStyle}>{title}</h2>
    </div>
  );
}

function normalizeThemeOverrides(value: Record<string, unknown> | undefined): ThemeOverrides {
  const record = value ?? {};
  const colors = toRecord(record.colors);
  const typography = toRecord(record.typography);
  const layout = toRecord(record.layout);
  const assets = toRecord(record.assets);

  return {
    colors: pickStringMap(colors, ['bg', 'surface', 'surfaceAlt', 'text', 'textMuted', 'border', 'primary', 'primaryContrast', 'secondary', 'accent', 'success', 'warning', 'danger']),
    typography: {
      ...pickStringMap(typography, ['fontSans', 'fontSerif', 'fontDisplay', 'fontH1', 'fontH2', 'fontH3', 'fontBody', 'fontParagraph', 'fontSansColor', 'fontDisplayColor', 'fontH1Color', 'fontH2Color', 'fontH3Color', 'fontBodyColor', 'fontParagraphColor']),
      ...(typeof typography.headingWeight === 'number' ? { headingWeight: typography.headingWeight } : {}),
      ...(typeof typography.bodyWeight === 'number' ? { bodyWeight: typography.bodyWeight } : {}),
    },
    layout: {
      ...pickStringMap(layout, ['template', 'nav', 'hero', 'contentWidth', 'sectionRhythm', 'sectionBorder', 'cardStyle', 'cardRadius']),
      ...(typeof layout.navSticky === 'boolean' ? { navSticky: layout.navSticky } : {}),
    },
    assets: pickStringMap(assets, ['backgroundImageUrl', 'cardBackgroundImageUrl', 'heroBackgroundImageUrl']),
  };
}

function normalizeLayoutOverrides(value: Record<string, unknown>): Partial<NonNullable<ThemeOverrides['layout']>> {
  return {
    ...pickStringMap(value, ['template', 'nav', 'hero', 'contentWidth', 'sectionRhythm', 'sectionBorder', 'cardStyle', 'cardRadius']),
    ...(typeof value.navSticky === 'boolean' ? { navSticky: value.navSticky } : {}),
    ...(typeof value.sectionDivider === 'string' ? { sectionBorder: value.sectionDivider as NonNullable<ThemeOverrides['layout']>['sectionBorder'] } : {}),
    ...(typeof value.surfaceStyle === 'string' ? { cardStyle: value.surfaceStyle as NonNullable<ThemeOverrides['layout']>['cardStyle'] } : {}),
    ...(typeof value.surfaceRadius === 'string' ? { cardRadius: value.surfaceRadius as NonNullable<ThemeOverrides['layout']>['cardRadius'] } : {}),
  };
}

function pickStringMap(source: Record<string, unknown>, keys: string[]): Record<string, string> {
  return keys.reduce<Record<string, string>>((accumulator, key) => {
    if (typeof source[key] === 'string' && source[key].trim().length > 0) {
      accumulator[key] = source[key] as string;
    }
    return accumulator;
  }, {});
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringProp(props: Record<string, unknown>, key: string, fallback: string): string {
  return typeof props[key] === 'string' ? props[key] : fallback;
}

function renderBlockActions(props: Record<string, unknown>, fallbacks: BlockActionFallbacks = {}): ReactNode {
  const actions = blockActionList(props, fallbacks);
  if (!actions.length) return null;

  return (
    <div className="block-actions">
      {actions.map((action, index) => (
        <a key={`${action.label}-${index}`} className={action.kind === 'secondary' ? 'secondary-action' : 'primary-action'} href={action.href}>
          {action.label}
        </a>
      ))}
    </div>
  );
}

function blockActionList(props: Record<string, unknown>, fallbacks: BlockActionFallbacks = {}): BlockAction[] {
  const primaryLabel = stringProp(props, 'buttonLabel', fallbacks.primaryLabel ?? '');
  const primaryHref = stringProp(props, 'buttonHref', fallbacks.primaryHref ?? '');
  const secondaryLabel = stringProp(props, 'buttonSecondaryLabel', fallbacks.secondaryLabel ?? '');
  const secondaryHref = stringProp(props, 'buttonSecondaryHref', fallbacks.secondaryHref ?? '');

  const actions: BlockAction[] = [];
  if (primaryLabel && primaryHref) actions.push({ label: primaryLabel, href: primaryHref, kind: 'primary' });
  if (secondaryLabel && secondaryHref) actions.push({ label: secondaryLabel, href: secondaryHref, kind: 'secondary' });
  return actions;
}

function stringArrayProp(props: Record<string, unknown>, key: string): string[] {
  const value = props[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function resolveBlockStyle(props: Record<string, unknown>, defaults: Record<string, unknown>): CSSProperties {
  return resolveTextAndSpacingStyle(toRecord(props.textStyle), toRecord(props.spacing), {
    fontFamily: toRecord(defaults.textStyle).fontFamily as string | undefined,
    color: toRecord(defaults.textStyle).color as string | undefined,
    fontSize: toRecord(defaults.textStyle).fontSize as string | undefined,
    lineHeight: toRecord(defaults.textStyle).lineHeight as string | undefined,
    textAlign: toRecord(defaults.textStyle).textAlign as string | undefined,
    margin: toRecord(defaults.spacing).margin as string | undefined,
    padding: toRecord(defaults.spacing).padding as string | undefined,
    interline: toRecord(defaults.spacing).interline as string | undefined,
  });
}

function resolveTitleStyle(props: Record<string, unknown>): CSSProperties {
  return resolveTextAndSpacingStyle(toRecord(props.titleTextStyle), {}, {
    fontFamily: undefined,
    color: undefined,
    fontSize: undefined,
    lineHeight: undefined,
    textAlign: undefined,
    margin: '',
    padding: '',
    interline: undefined,
  });
}

function resolveBlockGutter(style: CSSProperties): string | undefined {
  return (style.margin as string | undefined) ?? (style.padding as string | undefined);
}

function stripBlockSpacing(style: CSSProperties): CSSProperties {
  const copy = { ...(style as Record<string, unknown>) } as Record<string, unknown>;
  delete copy.margin;
  delete copy.padding;
  copy['--block-margin'] = '0';
  copy['--block-padding'] = '0';
  return copy as CSSProperties;
}

function resolveTextAndSpacingStyle(
  textStyle: Record<string, unknown>,
  spacing: Record<string, unknown>,
  defaults: { fontFamily?: string; color?: string; fontSize?: string; lineHeight?: string; textAlign?: string; margin?: string; padding?: string; interline?: string },
): CSSProperties {
  const style: Record<string, string> = {};

  const fontFamily = pickNonEmptyString(textStyle.fontFamily, defaults.fontFamily);
  const color = pickNonEmptyString(textStyle.color, defaults.color);
  const fontSize = resolveCssLength(pickNonEmptyString(textStyle.fontSize, defaults.fontSize), defaults.fontSize);
  const lineHeight = pickNonEmptyString(textStyle.lineHeight, defaults.lineHeight);
  const margin = pickNonEmptyString(spacing.margin, defaults.margin);
  const padding = pickNonEmptyString(spacing.padding, defaults.padding);
  const interline = pickNonEmptyString(spacing.interline, defaults.interline);
  const resolvedLineHeight = lineHeight ?? interline;
  const textAlign = pickTextAlign(textStyle.textAlign, defaults.textAlign);

  setCssVar(style, '--block-font-family', fontFamily);
  setCssVar(style, '--block-text-color', color);
  setCssVar(style, '--block-text-size', fontSize);
  setCssVar(style, '--block-line-height', resolvedLineHeight);
  setCssVar(style, '--block-margin', margin);
  setCssVar(style, '--block-padding', padding);
  setCssVar(style, '--block-interline', interline);
  setCssVar(style, '--block-text-align', textAlign);

  if (fontFamily) style.fontFamily = fontFamily;
  if (color) style.color = color;
  if (fontSize) style.fontSize = fontSize;
  if (resolvedLineHeight) style.lineHeight = resolvedLineHeight;
  if (textAlign) style.textAlign = textAlign;
  if (margin) style.margin = margin;
  if (padding) style.padding = padding;

  return style as CSSProperties;
}

function resolveSpacingOnlyStyle(props: Record<string, unknown>, defaults: { margin?: string; padding?: string }): CSSProperties {
  const spacing = toRecord(props.spacing);
  const style: Record<string, string> = {};
  const margin = pickNonEmptyString(spacing.margin, defaults.margin);
  const padding = pickNonEmptyString(spacing.padding, defaults.padding);
  setCssVar(style, '--block-margin', margin);
  setCssVar(style, '--block-padding', padding);
  if (margin) style.margin = margin;
  if (padding) style.padding = padding;
  return style as CSSProperties;
}

function imageOverlayItemsProp(props: Record<string, unknown>): Array<{ id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; position: string; framed: boolean; style: CSSProperties }> {
  const value = props.overlays;
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const tag = record.tag === 'h1' || record.tag === 'h2' || record.tag === 'h3' || record.tag === 'p' ? record.tag : 'h2';
      const style = resolveTextAndSpacingStyle(toRecord(record.textStyle), toRecord(record.spacing), {
        fontFamily: 'Cormorant Garamond',
        color: '#ffffff',
        fontSize: '',
        lineHeight: '',
        margin: '',
        padding: '',
        interline: '',
      });
      return {
        id: typeof record.id === 'string' && record.id.trim().length > 0 ? record.id : `overlay-${index}`,
        tag,
        text: typeof record.text === 'string' ? record.text : '',
        position: typeof record.position === 'string' && record.position.trim().length > 0 ? record.position : 'bottom-left',
        framed: typeof record.framed === 'boolean' ? record.framed : false,
        style,
      };
    })
    .filter((item): item is { id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; position: string; framed: boolean; style: CSSProperties } => item !== null && item.text.trim().length > 0);
}

function groupImageOverlayItems(items: Array<{ id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; position: string; framed: boolean; style: CSSProperties }>) {
  return items.reduce<Array<{ position: string; items: typeof items }>>((accumulator, item) => {
    const existing = accumulator.find((entry) => entry.position === item.position);
    if (existing) existing.items.push(item);
    else accumulator.push({ position: item.position, items: [item] });
    return accumulator;
  }, []);
}

function renderImageOverlay(overlay: { id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; framed: boolean; style: CSSProperties }, index: number): ReactNode {
  const className = ['image-block-overlay-item', overlay.framed ? 'image-block-overlay-item--framed' : ''].filter(Boolean).join(' ');
  const style = overlay.style;
  if (overlay.tag === 'h1') return <h1 key={overlay.id ?? `${index}`} className={className} style={style}>{overlay.text}</h1>;
  if (overlay.tag === 'h2') return <h2 key={overlay.id ?? `${index}`} className={className} style={style}>{overlay.text}</h2>;
  if (overlay.tag === 'h3') return <h3 key={overlay.id ?? `${index}`} className={className} style={style}>{overlay.text}</h3>;
  return <p key={overlay.id ?? `${index}`} className={className} style={style}>{overlay.text}</p>;
}

function imageButtonProp(props: Record<string, unknown>, blockStyle: CSSProperties) {
  const enabled = typeof props.buttonEnabled === 'boolean' ? props.buttonEnabled : Boolean(stringProp(props, 'buttonLabel', '') && stringProp(props, 'buttonHref', ''));
  if (!enabled) return null;
  const position = imageButtonPositionProp(props.buttonPosition);
  const variant = imageButtonVariantProp(props.buttonStyle);
  const style = resolveTextAndSpacingStyle(toRecord(props.buttonTextStyle), toRecord(props.buttonSpacing), {
    fontFamily: (blockStyle.fontFamily as string | undefined) ?? undefined,
    color: (blockStyle.color as string | undefined) ?? undefined,
    fontSize: '0.95rem',
    lineHeight: '1.2',
    margin: '',
    padding: '',
    interline: '1.2',
    textAlign: 'center',
  });
  return {
    label: stringProp(props, 'buttonLabel', ''),
    href: stringProp(props, 'buttonHref', ''),
    position,
    variant,
    style,
  };
}

function imageButtonPositionProp(value: unknown): string {
  return value === 'top-left' || value === 'top-center' || value === 'top-right' || value === 'middle-left' || value === 'center' || value === 'middle-right' || value === 'bottom-left' || value === 'bottom-center' || value === 'bottom-right' ? value : 'bottom-right';
}

function imageButtonVariantProp(value: unknown): 'primary' | 'secondary' | 'ghost' {
  return value === 'secondary' || value === 'ghost' ? value : 'primary';
}

function setCssVar(target: Record<string, string>, name: string, value?: string | null) {
  if (value && value.trim().length > 0) target[name] = value;
}

function resolveCssLength(value?: string | null, fallback?: string): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) return fallback;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

function pickTextAlign(...values: Array<unknown>): 'left' | 'center' | 'right' | 'justify' | undefined {
  for (const value of values) {
    if (value === 'left' || value === 'center' || value === 'right' || value === 'justify') return value;
  }
  return undefined;
}

function pickNonEmptyString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

type NavLinkItem = { label: string; href: string };
type SocialLinkItem = { href: string };

type CarouselSlideBase = {
  eyebrow?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type BlockAction = { label: string; href: string; kind: 'primary' | 'secondary' };

type BlockActionFallbacks = {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

function carouselSlidesProp(props: Record<string, unknown>, preset: string): CarouselSlideBase[] {
  const value = props.slides;
  if (!Array.isArray(value) || value.length === 0) return getCarouselPresetSlides(preset);

  return value
    .map((slide): CarouselSlideBase | null => {
      const record = toRecord(slide);
      const title = typeof record.title === 'string' && record.title.trim() ? record.title : '';
      if (!title) return null;
      return {
        eyebrow: typeof record.eyebrow === 'string' ? record.eyebrow : undefined,
        title,
        body: typeof record.body === 'string' ? record.body : undefined,
        imageUrl: typeof record.imageUrl === 'string' ? record.imageUrl : undefined,
        ctaLabel: typeof record.ctaLabel === 'string' ? record.ctaLabel : undefined,
        ctaHref: typeof record.ctaHref === 'string' ? record.ctaHref : undefined,
      };
    })
    .filter((slide): slide is CarouselSlideBase => slide !== null);
}



function stringRecordProp(props: Record<string, unknown> | undefined, key: string, fallback: string): string {
  return props && typeof props[key] === 'string' && props[key].trim().length > 0 ? (props[key] as string) : fallback;
}

function booleanRecordProp(props: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean {
  return props && typeof props[key] === 'boolean' ? (props[key] as boolean) : fallback;
}

function inferSocialIcon(href: string): ReactNode {
  const value = href.trim().toLowerCase();
  const svgProps = { className: 'social-icon-svg', viewBox: '0 0 24 24', width: 18, height: 18, 'aria-hidden': true, focusable: false } as const;
  if (value.includes('instagram.com')) return <svg {...svgProps}><rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17" cy="7" r="1.2" fill="currentColor"/></svg>;
  if (value.includes('tiktok.com')) return <svg {...svgProps}><path d="M14 4v10.2a3.8 3.8 0 1 1-3.8-3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/><path d="M14 4c.7 2.7 2.3 4.2 5 4.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/></svg>;
  if (value.includes('x.com') || value.includes('twitter.com')) return <svg {...svgProps}><path d="m5 5 14 14M19 5 5 19" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4"/></svg>;
  if (value.includes('facebook.com')) return <svg {...svgProps}><path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z" fill="currentColor"/></svg>;
  if (value.includes('linkedin.com')) return <svg {...svgProps}><path d="M5 9h4v10H5zM7 5.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM11 9h3.8v1.4A4 4 0 0 1 22 13v6h-4v-5.3c0-1.2-.6-2-1.6-2s-1.4.7-1.4 2V19h-4z" fill="currentColor"/></svg>;
  if (value.includes('youtube.com') || value.includes('youtu.be')) return <svg {...svgProps}><rect x="3" y="6" width="18" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></svg>;
  if (value.includes('pinterest.com')) return <svg {...svgProps}><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M10.5 18c.5-1.7 1-3.4 1.4-5.1m0 0c-.4-.8-.2-2.8 1.2-2.8 1 0 1.4.8 1.4 1.7 0 1.4-.8 2.4-2 2.4-1.8 0-3-1.2-3-3 0-2.1 1.6-3.8 4-3.8 2.3 0 4 1.6 4 4 0 3-1.7 5-4 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7"/></svg>;
  if (value.startsWith('mailto:')) return <svg {...svgProps}><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m4 8 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
  if (value.includes('whatsapp.com') || value.includes('wa.me')) return <svg {...svgProps}><path d="M5 20l1.2-3A8 8 0 1 1 9 19.2Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9.5 8.5c.5 3 2.3 4.8 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/></svg>;
  return <svg {...svgProps}><path d="M7 17 17 7M10 7h7v7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/></svg>;
}

function inferSocialLabel(href: string): string {
  const value = href.trim().toLowerCase();
  if (value.includes('instagram.com')) return 'Instagram';
  if (value.includes('tiktok.com')) return 'TikTok';
  if (value.includes('x.com') || value.includes('twitter.com')) return 'X / Twitter';
  if (value.includes('facebook.com')) return 'Facebook';
  if (value.includes('linkedin.com')) return 'LinkedIn';
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'YouTube';
  if (value.includes('pinterest.com')) return 'Pinterest';
  if (value.includes('threads.net')) return 'Threads';
  if (value.startsWith('mailto:')) return 'Email';
  if (value.includes('whatsapp.com') || value.includes('wa.me')) return 'WhatsApp';
  return 'Social link';
}

function navItemsRecordProp(props: Record<string, unknown> | undefined, key: string, fallback: NavLinkItem[]): NavLinkItem[] {
  const value = props?.[key];
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      const record = toRecord(item);
      const label = typeof record.label === 'string' ? record.label : '';
      const href = typeof record.href === 'string' ? record.href : '';
      if (!label.trim() && !href.trim()) return null;
      return { label, href };
    })
    .filter((item): item is NavLinkItem => item !== null);
}

function socialItemsRecordProp(props: Record<string, unknown> | undefined, key: string, fallback: SocialLinkItem[]): SocialLinkItem[] {
  const value = props?.[key];
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim().length > 0 ? { href: item } : null;
      const record = toRecord(item);
      const href = typeof record.href === 'string' ? record.href : '';
      return href.trim().length > 0 ? { href } : null;
    })
    .filter((item): item is SocialLinkItem => item !== null);
}

function defaultNavLinks(tenantSlug: string, hasBooking: boolean, hasCrm: boolean): NavLinkItem[] {
  const links: NavLinkItem[] = [{ label: 'Services', href: '#services' }, { label: 'Location', href: '#location' }];
  if (hasBooking) links.push({ label: 'Booking', href: `/t/${tenantSlug}/booking` });
  if (hasCrm) links.push({ label: 'Client portal', href: '/portal' });
  return links;
}

function carouselVisibleCount(props: Record<string, unknown>, preset: string): number {
  const fallback = getCarouselPresetDefaults(preset).visibleCount;
  const value = props.visibleCount;
  if (typeof value === 'number' && Number.isFinite(value)) return clamp(Math.round(value), 1, 4);
  if (typeof value === 'string' && value.trim()) return clamp(Number.parseInt(value, 10) || fallback, 1, 4);
  return fallback;
}

function carouselMode(props: Record<string, unknown>, preset: string): 'manual' | 'auto' {
  const fallback = getCarouselPresetDefaults(preset).scrollMode;
  return props.scrollMode === 'manual' || props.scrollMode === 'auto' ? props.scrollMode : fallback;
}

function carouselStyle(props: Record<string, unknown>, preset: string): 'snap' | 'smooth' {
  const fallback = getCarouselPresetDefaults(preset).scrollStyle;
  return props.scrollStyle === 'snap' || props.scrollStyle === 'smooth' ? props.scrollStyle : fallback;
}

function carouselAutoAdvanceMs(props: Record<string, unknown>, preset: string): number {
  const fallback = getCarouselPresetDefaults(preset).autoAdvanceMs;
  const value = props.autoAdvanceMs;
  if (typeof value === 'number' && Number.isFinite(value)) return clamp(Math.round(value), 1200, 12000);
  if (typeof value === 'string' && value.trim()) return clamp(Number.parseInt(value, 10) || fallback, 1200, 12000);
  return fallback;
}

function escapeCssUrl(value: string): string {
  return value.replace(/'/g, "\\'");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatAddress(address: unknown): ReactNode {
  const value = toRecord(address);
  return [value.street, value.city, value.country].filter((part): part is string => typeof part === 'string').join(', ');
}
