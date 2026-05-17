import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AdminToastProvider } from './admin-toast';
import { ThemePresetSwitcher } from './theme-preset-switcher';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe('branding editor regression coverage', () => {
  it('renders live-preview controls for all persisted branding/background fields', () => {
    const html = renderToStaticMarkup(
      <AdminToastProvider>
        <ThemePresetSwitcher
          initialPresetId="editorial-bistro"
          tenantName="Maison Test"
          initialLogoUrl="/uploads/logo.svg"
          initialFaviconUrl="/uploads/favicon.svg"
          initialLayoutConfig={{
            logotype: 'Maison Test Logotype',
            nav: 'overlay',
            navSticky: false,
            navTransparency: 'transparent',
            navBrandSlot: 'both',
            navRightText: 'Open tonight',
            navLinks: [{ label: 'Story', href: '#story' }],
            navSocialLinks: ['https://instagram.com/maison'],
            hero: 'full-bleed',
            contentWidth: 'full',
            sectionRhythm: 'compact',
            sectionDivider: 'none',
            surfaceStyle: 'glass',
            surfaceRadius: 'square',
            headerSpacing: 'overlay',
          }}
          initialThemeOverrides={{
            typography: { fontDisplay: 'Bodoni Moda', fontH1Color: '#c8a96b', fontParagraphColor: '#f4efe6' },
            assets: {
              backgroundImageUrl: '/uploads/page-bg.webp',
              cardBackgroundImageUrl: '/uploads/card-bg.webp',
              heroBackgroundImageUrl: '/uploads/hero-bg.webp',
            },
          }}
        />
      </AdminToastProvider>,
    );

    expect(html).toContain('Maison Test Logotype');
    expect(html).toContain('data-nav-transparency="transparent"');
    expect(html).toContain('data-nav-brand-slot="both"');
    expect(html).toContain('data-header-spacing="overlay"');
    expect(html).toContain('data-card-radius="square"');
    expect(html).not.toContain('Menu item spacing');
    expect(html).not.toContain('Block defaults');
    expect(html).not.toContain('H1 font');
    expect(html).toContain('/uploads/page-bg.webp');
    expect(html).toContain('/uploads/card-bg.webp');
    expect(html).toContain('/uploads/hero-bg.webp');
    expect(html).toContain('Drop to replace');
  });

  it('keeps drag/drop image upload affordances styled', () => {
    const css = readFileSync(join(process.cwd(), 'app/styles.css'), 'utf8');

    expect(css).toContain(".image-field-card[data-dragging='true']");
    expect(css).toContain('.image-preview-overlay');
    expect(css).toContain(".image-field-card:hover .image-preview-overlay");
  });

  it('keeps shared editor sections, numeric font size, and stable nav item keys wired in source', () => {
    const source = readFileSync(join(process.cwd(), 'app/theme-preset-switcher.tsx'), 'utf8');

    expect(source).toContain('showAdvancedControls');
    expect(source).toContain('branding-details');
    expect(source).toContain('fontSizeInputValue(form.blockFontSize, 18)');
    expect(source).toContain('Very small');
    expect(source).toContain('Standard');
    expect(source).toContain('Block margin size');
    expect(source).toContain('emptyStringToUndefined(form.blockMargin)');
    expect(source).toContain('menuItemGap');
    expect(source).toContain('cssLengthFromInput(form.menuItemGap,');
    expect(source).toContain('key={index}');
  });
});
