import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { demoFrontpage } from './demo-frontpage';
import { FrontpageShell } from './frontpage';
import PublicBookingPage from './booking/page';

describe('frontpage rendering', () => {
  it('renders a frontpage-only tenant without booking or CRM links', () => {
    const html = renderToStaticMarkup(<FrontpageShell model={demoFrontpage} />);

    expect(html).toContain('Bistro Lumiere');
    expect(html).toContain('href="/en"');
    expect(html).toContain('layout-editorial');
    expect(html).toContain('data-section-rhythm="spacious"');
    expect(html).toContain('data-card-radius="round"');
    expect(html).toContain('hero-panel');
    expect(html).toContain('carousel-block');
    expect(html).toContain('carousel-slide');
    expect(html).toContain('data-carousel-visible="');
    expect(html).not.toContain('Booking</a>');
    expect(html).not.toContain('Client portal');
  });

  it('renders the customizable menu bar sections', () => {
    const model = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        layoutConfig: {
          ...demoFrontpage.tenant.layoutConfig,
          navTransparency: 'transparent',
          navUnderlineHover: false,
          navBrandSlot: 'both',
          navRightText: 'Follow us online',
          navLinks: [{ label: 'Gallery', href: '/gallery' }],
          navSocialLinks: ['https://instagram.com/example'],
        },
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('data-nav-transparency="transparent"');
    expect(html).toContain('data-nav-underline-hover="false"');
    expect(html).toContain('Gallery');
    expect(html).toContain('Follow us online');
    expect(html).toContain('social-icon-svg');
    expect(html).not.toContain('IG');
    expect(html).not.toContain('Instagram</a>');
  });

  it('supports keeping side margins when the width is not full', () => {
    const model = {
      ...demoFrontpage,
      tenant: { ...demoFrontpage.tenant, layoutConfig: { ...demoFrontpage.tenant.layoutConfig, contentWidth: 'centered' } },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('data-content-width="centered"');
    expect(html).not.toContain('data-content-width="full"');
  });

  it('supports overlaying the first block beneath the header and custom nav height', () => {
    const model = {
      ...demoFrontpage,
      tenant: { ...demoFrontpage.tenant, layoutConfig: { ...demoFrontpage.tenant.layoutConfig, headerSpacing: 'overlay', navHeight: 'tall' } },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('data-header-spacing="overlay"');
    expect(html).toContain('data-nav-height="tall"');
  });

  it('ignores page layout presets and keeps the theme template', () => {
    const themed = {
      ...demoFrontpage,
      tenant: { ...demoFrontpage.tenant, layoutConfig: { ...demoFrontpage.tenant.layoutConfig, navSticky: false } },
      page: { ...demoFrontpage.page, layoutPreset: 'classic' },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={themed} />);

    expect(html).toContain('layout-editorial');
    expect(html).toContain('data-layout-template="editorial"');
    expect(html).toContain('data-nav-sticky="false"');
  });

  it('supports removing side margins with full width', () => {
    const themed = {
      ...demoFrontpage,
      tenant: { ...demoFrontpage.tenant, layoutConfig: { ...demoFrontpage.tenant.layoutConfig, contentWidth: 'full' } },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={themed} />);

    expect(html).toContain('data-content-width="full"');
  });

  it('propagates saved branding assets, typography, and background images to public runtime CSS variables', () => {
    const themed = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        logoUrl: '/uploads/logo.svg',
        layoutConfig: { ...demoFrontpage.tenant.layoutConfig, logotype: 'Custom Logotype', navBrandSlot: 'both', hero: 'full-bleed', surfaceStyle: 'glass' },
        themeOverrides: {
          typography: { fontDisplay: 'Bodoni Moda', fontH1Color: '#c8a96b', fontParagraphColor: '#f4efe6' },
          assets: {
            backgroundImageUrl: '/uploads/page-bg.webp',
            cardBackgroundImageUrl: '/uploads/card-bg.webp',
            heroBackgroundImageUrl: '/uploads/hero-bg.webp',
          },
        },
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={themed} />);

    expect(html).toContain('/uploads/logo.svg');
    expect(html).toContain('Custom Logotype');
    expect(html).toContain('--font-display:&#x27;Bodoni Moda&#x27;');
    expect(html).toContain('--font-h1-color:#c8a96b');
    expect(html).toContain('--background-image:url(&#x27;/uploads/page-bg.webp&#x27;)');
    expect(html).toContain('--card-background-image:url(&#x27;/uploads/card-bg.webp&#x27;)');
    expect(html).toContain('--hero-background-image:url(&#x27;/uploads/hero-bg.webp&#x27;)');
    expect(html).toContain('data-hero-variant="full-bleed"');
    expect(html).toContain('data-card-style="glass"');
  });

  it('accepts the clearer surface and divider override names', () => {
    const themed = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        layoutConfig: {
          ...demoFrontpage.tenant.layoutConfig,
          surfaceStyle: 'glass',
          surfaceRadius: 'square',
          sectionDivider: 'none',
        },
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={themed} />);

    expect(html).toContain('data-card-style="glass"');
    expect(html).toContain('data-card-radius="square"');
    expect(html).toContain('data-section-border="none"');
  });

  it('renders carousel presets even when the block has no slides yet', () => {
    const model = {
      ...demoFrontpage,
      page: {
        ...demoFrontpage.page,
        blocks: [{ id: 'carousel', type: 'carousel', variant: 'offers', position: 0, props: { title: 'Offers', visibleCount: 1 } }],
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('carousel-offers');
    expect(html).toContain('Chef tasting menu');
    expect(html).toContain('carousel-footer');
    expect(html).toContain('flex:0 0 calc((100% - 0px) / 1)');
  });

  it('inherits branding defaults for block typography, spacing, and menu item gap', () => {
    const model = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        layoutConfig: {
          ...demoFrontpage.tenant.layoutConfig,
          blockDefaults: {
            textStyle: {
              fontFamily: 'Fraunces',
              color: '#123456',
              fontSize: '24',
              lineHeight: '1.7',
            },
            spacing: {
              margin: '2rem',
              padding: '1rem',
              interline: '1.7',
            },
          },
          menuDefaults: {
            itemGap: '22',
          },
        },
      },
      page: {
        ...demoFrontpage.page,
        blocks: [{ id: 'services', type: 'service-list', variant: 'cards', position: 0, props: { title: 'Services' } }],
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('--menu-item-gap:22px');
    expect(html).toContain('--block-font-family:Fraunces');
    expect(html).toContain('--block-text-color:#123456');
    expect(html).toContain('--block-text-size:24px');
    expect(html).toContain('--block-line-height:1.7');
    expect(html).toContain('--block-margin:2rem');
    expect(html).toContain('--block-padding:1rem');
  });

  it('keeps menu bar margins independent from block margins', () => {
    const model = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        layoutConfig: {
          ...demoFrontpage.tenant.layoutConfig,
          menuDefaults: {
            margin: '4rem',
            itemGap: '20',
          },
          blockDefaults: {
            spacing: { margin: '2rem' },
          },
        },
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);
    const headerStyle = html.match(/<header[^>]*style="([^"]+)"/);

    expect(headerStyle?.[1] ?? '').not.toContain(';margin:4rem');
    expect(headerStyle?.[1] ?? '').toContain('--menu-item-gap:20px');
    expect(html).toContain('--block-margin:2rem');
  });

  it('renders image blocks with overlays and buttons while cover images ignore block margins', () => {
    const model = {
      ...demoFrontpage,
      tenant: {
        ...demoFrontpage.tenant,
        layoutConfig: {
          ...demoFrontpage.tenant.layoutConfig,
          blockDefaults: {
            spacing: { margin: '2rem', padding: '1rem' },
            textStyle: { textAlign: 'right' },
          },
        },
      },
      page: {
        ...demoFrontpage.page,
        blocks: [
          {
            id: 'image',
            type: 'image',
            variant: 'cover',
            position: 0,
            props: {
              imageUrl: 'https://example.com/image.jpg',
              caption: 'A visual highlight',
              overlays: [
                { id: 'overlay-1', tag: 'h1', text: 'Maison Noire', framed: false, position: 'top-left' },
                { id: 'overlay-2', tag: 'p', text: 'An intimate evening table', position: 'bottom-right', framed: true },
              ],
              buttonEnabled: true,
              buttonLabel: 'See more',
              buttonHref: '/gallery',
              buttonPosition: 'center',
              buttonStyle: 'ghost',
              buttonTextStyle: { color: '#ffffff', fontSize: '1.1rem', textAlign: 'center' },
              buttonSpacing: { padding: '1.1rem 1.6rem' },
            },
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('image-block-cover');
    expect(html).not.toContain('image-block-framed');
    expect(html).toContain('--image-block-gutter:2rem');
    expect(html).not.toContain('margin:2rem');
    expect(html).toContain('image-block-overlay-top-left');
    expect(html).toContain('image-block-overlay-item--framed');
    expect(html).toContain('image-block-button--center');
    expect(html).toContain('image-block-button--ghost');
    expect(html).toContain('text-align:right');
    expect(html).toContain('font-size:1.1rem');
    expect(html).toContain('Maison Noire');
    expect(html).toContain('An intimate evening table');
    expect(html).toContain('See more');
    expect(html).toContain('href="/gallery"');
  });

  it('does not render default eyebrow labels in section blocks or carousel slides', () => {
    const model = {
      ...demoFrontpage,
      page: {
        ...demoFrontpage.page,
        blocks: [
          { id: 'services', type: 'service-list', variant: 'cards', position: 0, props: { title: 'Services' } },
          { id: 'location', type: 'location', variant: 'card', position: 1, props: { title: 'Location and hours' } },
          { id: 'carousel', type: 'carousel', variant: 'cards', position: 2, props: { title: 'Featured content' } },
        ],
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).not.toContain('block-heading"><p class="eyebrow">Services');
    expect(html).not.toContain('block-heading"><p class="eyebrow">Visit');
    expect(html).not.toContain('carousel-slide-eyebrow');
    expect(html).not.toContain('carousel-chip">3 visible');
  });

  it('renders split-media video when configured by the page editor', () => {
    const model = {
      ...demoFrontpage,
      page: {
        ...demoFrontpage.page,
        blocks: [
          { id: 'split-video', type: 'split-media', variant: 'image-right', position: 0, props: { title: 'Video story', body: 'Moving image support.', mediaType: 'video', videoUrl: '/uploads/split-video.mp4', alt: 'Dining room video' } },
        ],
      },
    };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('split-media-block');
    expect(html).toContain('<video');
    expect(html).toContain('src="/uploads/split-video.mp4"');
    expect(html).toContain('Dining room video');
  });

  it('preserves tenant context in public booking links', () => {
    const model = { ...demoFrontpage, tenant: { ...demoFrontpage.tenant, slug: 'oak-clinic', enabledModules: ['frontpage', 'booking', 'crm'] } };
    const html = renderToStaticMarkup(<FrontpageShell model={model} />);

    expect(html).toContain('/t/oak-clinic/booking');
    expect(html).not.toContain('href="/booking"');
  });

  it('keeps layout-specific styling rules for the public runtime', () => {
    const css = readFileSync(join(process.cwd(), 'app/styles.css'), 'utf8');

    expect(css).toContain('.frontpage.layout-classic .hero');
    expect(css).toContain(".frontpage[data-layout-template='editorial'] .hero");
    expect(css).toContain(".frontpage[data-section-rhythm='compact'] .frontpage-content");
    expect(css).toContain('.frontpage.layout-split .hero');
    expect(css).toContain('.frontpage.layout-immersive .hero');
    expect(css).toContain('position: sticky;');
    expect(css).toContain(".frontpage[data-nav-sticky='false'] .site-nav");
  });

  it('keeps a mobile layout smoke rule for narrow screens', () => {
    const css = readFileSync(join(process.cwd(), 'app/styles.css'), 'utf8');

    expect(css).toContain('@media (max-width: 720px)');
    expect(css).toContain('grid-template-columns: 1fr;');
    expect(css).toContain('@keyframes fade-up');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('renders booking form labels and accessible error messaging', () => {
    const html = renderToStaticMarkup(<PublicBookingPage />);

    expect(html).toContain('tenant-brand-banner');
    expect(html).toContain('/demo-assets/luxury/logo.svg');
    expect(html).toContain('data-tenant="maison-noire"');
    expect(html).toContain('aria-label="Booking details"');
    expect(html).toContain('for="customerName"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('Dinner reservation');
  });
});
