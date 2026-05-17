'use client';

import React, { type CSSProperties, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createThemeRuntimeSurface, getThemePreset, mergeTheme, themePresets, type ThemeCardRadius, type ThemeLayout, type ThemeOverrides, type ThemePreset } from '@margo/themes';
import { useAdminToast } from './admin-toast';

type BrandingFormState = {
  logoUrl: string;
  faviconUrl: string;
  logotype: string;
  nav: string;
  navSticky: boolean;
  navTransparency: string;
  navUnderlineHover: boolean;
  navBrandSlot: string;
  navHeight: string;
  navRightText: string;
  navLinks: NavLinkItem[];
  navSocialLinks: SocialLinkItem[];
  menuFontFamily: string;
  menuFontColor: string;
  menuFontSize: string;
  menuInterline: string;
  menuItemGap: string;
  menuMargin: string;
  menuPadding: string;
  hero: string;
  contentWidth: string;
  sectionRhythm: string;
  sectionBorder: string;
  headerSpacing: string;
  cardStyle: string;
  cardRadius: ThemeCardRadius;
  fontSans: string;
  fontSansColor: string;
  fontDisplay: string;
  fontDisplayColor: string;
  fontH1: string;
  fontH1Color: string;
  fontH2: string;
  fontH2Color: string;
  fontH3: string;
  fontH3Color: string;
  fontBody: string;
  fontBodyColor: string;
  fontParagraph: string;
  fontParagraphColor: string;
  blockFontFamily: string;
  blockFontColor: string;
  blockFontSize: string;
  blockInterline: string;
  blockMargin: string;
  blockPadding: string;
  backgroundImageUrl: string;
  cardBackgroundImageUrl: string;
  heroBackgroundImageUrl: string;
};

type NavLinkItem = { label: string; href: string };
type SocialLinkItem = { href: string };

const navOptions = ['top', 'centered', 'minimal', 'overlay'] as const;
const navTransparencyOptions = ['solid', 'glass', 'transparent'] as const;
const navBrandSlotOptions = ['logo', 'logotype', 'both'] as const;
const navHeightOptions = [
  { value: 'compact', label: 'Compact' },
  { value: 'regular', label: 'Regular' },
  { value: 'tall', label: 'Tall' },
] as const;
const heroOptions = ['split-image', 'full-bleed', 'card-stack', 'brutalist'] as const;
const contentWidthOptions = [
  { value: 'centered', label: 'With side margins' },
  { value: 'full', label: 'Full width' },
] as const;
const navStickyOptions = ['sticky', 'static'] as const;
const rhythmOptions = ['none', 'compact', 'spacious'] as const;
const sectionBorderOptions = ['thin', 'thick', 'none'] as const;
const cardOptions = ['soft-shadow', 'flat', 'brutalist', 'glass'] as const;
const cardRadiusOptions = ['round', 'square'] as const;
const headerSpacingOptions = [
  { value: 'margin', label: 'Header margin' },
  { value: 'overlay', label: 'Overlay first block' },
] as const;
const fontOptions = ['Inter', 'Cormorant Garamond', 'Space Grotesk', 'Nunito Sans', 'Playfair Display', 'Bodoni Moda', 'Fraunces', 'Libre Baskerville', 'system-ui', 'serif'] as const;
const blockSizeOptions = [
  { value: '', label: 'Default' },
  { value: '0.9rem', label: 'Small' },
  { value: '1rem', label: 'Medium' },
  { value: '1.125rem', label: 'Large' },
  { value: '1.25rem', label: 'XL' },
  { value: '1.5rem', label: '2XL' },
] as const;
const blockSpacingOptions = [
  { value: '', label: 'Default' },
  { value: '0', label: 'None' },
  { value: '4px', label: 'Very small' },
  { value: '8px', label: 'Tiny' },
  { value: '12px', label: 'XS' },
  { value: '16px', label: 'SM' },
  { value: '20px', label: 'MD' },
  { value: '24px', label: 'LG' },
  { value: '28px', label: 'XL' },
  { value: '32px', label: 'Standard' },
] as const;
const blockInterlineOptions = [
  { value: '', label: 'Default' },
  { value: '1', label: 'Tight' },
  { value: '1.2', label: 'Small' },
  { value: '1.4', label: 'Normal' },
  { value: '1.6', label: 'Loose' },
  { value: '1.8', label: 'Very loose' },
] as const;

export function ThemePresetSwitcher({
  initialPresetId,
  tenantName,
  initialLayoutConfig = {},
  initialThemeOverrides = {},
  initialResolvedPreset,
  initialLogoUrl = '',
  initialFaviconUrl = '',
  showAdvancedControls = false,
}: {
  initialPresetId: string;
  tenantName: string;
  initialLayoutConfig?: Record<string, unknown>;
  initialThemeOverrides?: Record<string, unknown>;
  initialResolvedPreset?: ThemePreset;
  initialLogoUrl?: string | null;
  initialFaviconUrl?: string | null;
  showAdvancedControls?: boolean;
}) {
  const router = useRouter();
  const { pushToast } = useAdminToast();
  const [presetId, setPresetId] = useState(initialPresetId);
  const [message, setMessage] = useState('Changes preview live below. Save to publish them to the public site.');
  const [isPending, startTransition] = useTransition();
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const layoutBlockDefaults = getLayoutBlockDefaults(initialLayoutConfig);
  const layoutMenuDefaults = getLayoutMenuDefaults(initialLayoutConfig);
  const initialThemePreset = initialResolvedPreset ?? getThemePreset(initialPresetId);

  const [form, setForm] = useState<BrandingFormState>(() => ({
    logoUrl: initialLogoUrl ?? '',
    faviconUrl: initialFaviconUrl ?? '',
    logotype: stringRecordValue(initialLayoutConfig, 'logotype', tenantName),
    nav: stringRecordValue(initialLayoutConfig, 'nav', initialThemePreset.layout.nav),
    navSticky: booleanRecordValue(initialLayoutConfig, 'navSticky', initialThemePreset.layout.navSticky),
    navTransparency: stringRecordValue(initialLayoutConfig, 'navTransparency', 'glass'),
    navUnderlineHover: booleanRecordValue(initialLayoutConfig, 'navUnderlineHover', true),
    navBrandSlot: stringRecordValue(initialLayoutConfig, 'navBrandSlot', 'logo'),
    navHeight: normalizeNavHeightSelection(stringRecordValue(initialLayoutConfig, 'navHeight', 'regular')),
    navRightText: stringRecordValue(initialLayoutConfig, 'navRightText', ''),
    navLinks: navItemsRecordValue(initialLayoutConfig, 'navLinks', [
      { label: 'Services', href: '#services' },
      { label: 'Location', href: '#location' },
    ]),
    navSocialLinks: socialItemsRecordValue(initialLayoutConfig, 'navSocialLinks', []),
    menuFontFamily: stringRecordValue(layoutMenuDefaults, 'fontFamily', initialThemePreset.typography.fontSans),
    menuFontColor: stringRecordValue(layoutMenuDefaults, 'color', initialThemePreset.colors.text),
    menuFontSize: stringRecordValue(layoutMenuDefaults, 'fontSize', '0.95rem'),
    menuInterline: stringRecordValue(layoutMenuDefaults, 'interline', '1.45'),
    menuItemGap: stringRecordValue(layoutMenuDefaults, 'itemGap', '14'),
    menuMargin: stringRecordValue(layoutMenuDefaults, 'margin', ''),
    menuPadding: stringRecordValue(layoutMenuDefaults, 'padding', ''),
    hero: stringRecordValue(initialLayoutConfig, 'hero', initialThemePreset.layout.hero),
    contentWidth: normalizeSideMarginsSelection(stringRecordValue(initialLayoutConfig, 'contentWidth', initialThemePreset.layout.contentWidth)),
    sectionRhythm: stringRecordValue(initialLayoutConfig, 'sectionRhythm', initialThemePreset.layout.sectionRhythm),
    sectionBorder: stringRecordValue(initialLayoutConfig, 'sectionDivider', stringRecordValue(initialLayoutConfig, 'sectionBorder', initialThemePreset.layout.sectionBorder)),
    headerSpacing: normalizeHeaderSpacingSelection(stringRecordValue(initialLayoutConfig, 'headerSpacing', 'margin')),
    cardStyle: stringRecordValue(initialLayoutConfig, 'surfaceStyle', stringRecordValue(initialLayoutConfig, 'cardStyle', initialThemePreset.layout.cardStyle)),
    cardRadius: stringRecordValue(initialLayoutConfig, 'surfaceRadius', stringRecordValue(initialLayoutConfig, 'cardRadius', initialThemePreset.layout.cardRadius)) as ThemeCardRadius,
    fontSans: stringThemeOverride(initialThemeOverrides, ['typography', 'fontSans'], 'Inter'),
    fontSansColor: stringThemeOverride(initialThemeOverrides, ['typography', 'fontSansColor'], initialThemePreset.colors.text),
    fontDisplay: stringThemeOverride(initialThemeOverrides, ['typography', 'fontDisplay'], 'Cormorant Garamond'),
    fontDisplayColor: stringThemeOverride(initialThemeOverrides, ['typography', 'fontDisplayColor'], initialThemePreset.colors.text),
    fontH1: stringThemeOverride(initialThemeOverrides, ['typography', 'fontH1'], ''),
    fontH1Color: stringThemeOverride(initialThemeOverrides, ['typography', 'fontH1Color'], initialThemePreset.colors.text),
    fontH2: stringThemeOverride(initialThemeOverrides, ['typography', 'fontH2'], ''),
    fontH2Color: stringThemeOverride(initialThemeOverrides, ['typography', 'fontH2Color'], initialThemePreset.colors.text),
    fontH3: stringThemeOverride(initialThemeOverrides, ['typography', 'fontH3'], ''),
    fontH3Color: stringThemeOverride(initialThemeOverrides, ['typography', 'fontH3Color'], initialThemePreset.colors.text),
    fontBody: stringThemeOverride(initialThemeOverrides, ['typography', 'fontBody'], ''),
    fontBodyColor: stringThemeOverride(initialThemeOverrides, ['typography', 'fontBodyColor'], initialThemePreset.colors.text),
    fontParagraph: stringThemeOverride(initialThemeOverrides, ['typography', 'fontParagraph'], ''),
    fontParagraphColor: stringThemeOverride(initialThemeOverrides, ['typography', 'fontParagraphColor'], initialThemePreset.colors.text),
    blockFontFamily: nestedStringRecordValue(layoutBlockDefaults, ['textStyle', 'fontFamily'], initialThemePreset.typography.fontBody ?? initialThemePreset.typography.fontSans),
    blockFontColor: nestedStringRecordValue(layoutBlockDefaults, ['textStyle', 'color'], initialThemePreset.colors.text),
    blockFontSize: nestedStringRecordValue(layoutBlockDefaults, ['textStyle', 'fontSize'], '18'),
    blockInterline: nestedStringRecordValue(layoutBlockDefaults, ['spacing', 'interline'], '1.6'),
    blockMargin: nestedStringRecordValue(layoutBlockDefaults, ['spacing', 'margin'], '0'),
    blockPadding: nestedStringRecordValue(layoutBlockDefaults, ['spacing', 'padding'], '0'),
    backgroundImageUrl: stringThemeOverride(initialThemeOverrides, ['assets', 'backgroundImageUrl'], ''),
    cardBackgroundImageUrl: stringThemeOverride(initialThemeOverrides, ['assets', 'cardBackgroundImageUrl'], ''),
    heroBackgroundImageUrl: stringThemeOverride(initialThemeOverrides, ['assets', 'heroBackgroundImageUrl'], ''),
  }));

  const themeOverrides = useMemo(() => buildThemeOverrides(form), [form]);
  const activePreset = useMemo(() => (presetId === initialThemePreset.id ? initialThemePreset : getThemePreset(presetId)), [initialThemePreset, presetId]);
  const theme = useMemo(() => mergeTheme(activePreset, themeOverrides), [activePreset, themeOverrides]);
  const runtimeLayout = useMemo(
    () => ({
      ...theme.layout,
      nav: (form.nav || theme.layout.nav) as ThemeLayout['nav'],
      navSticky: form.navSticky ?? theme.layout.navSticky,
      hero: (form.hero || theme.layout.hero) as ThemeLayout['hero'],
      contentWidth: (form.contentWidth || theme.layout.contentWidth) as ThemeLayout['contentWidth'],
      sectionRhythm: (form.sectionRhythm || theme.layout.sectionRhythm) as ThemeLayout['sectionRhythm'],
      sectionBorder: (form.sectionBorder || theme.layout.sectionBorder) as ThemeLayout['sectionBorder'],
      cardStyle: (form.cardStyle || theme.layout.cardStyle) as ThemeLayout['cardStyle'],
      cardRadius: (form.cardRadius || theme.layout.cardRadius) as ThemeLayout['cardRadius'],
    }),
    [form.cardRadius, form.contentWidth, form.hero, form.nav, form.navSticky, form.sectionBorder, form.sectionRhythm, form.cardStyle, theme.layout],
  );
  const previewTheme = useMemo(() => ({ ...theme, layout: runtimeLayout }), [runtimeLayout, theme]);
  const runtimeSurface = useMemo(() => createThemeRuntimeSurface(previewTheme), [previewTheme]);
  const style = useMemo(() => runtimeSurface.style as CSSProperties, [runtimeSurface]);
  const previewImage = form.heroBackgroundImageUrl || form.backgroundImageUrl;
  const previewBlockPadding = cssLengthFromInput(form.blockPadding, '');
  const previewBlockMargin = cssLengthFromInput(form.blockMargin, '');
  const previewNavMargin = cssLengthFromInput(form.menuMargin, '');

  function setField<K extends keyof BrandingFormState>(field: K, value: BrandingFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadBrandingAsset(file: File, targetField: keyof BrandingFormState, kind: string) {
    setUploadingAsset(String(targetField));
    try {
      const response = await uploadImage(file, kind);
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        const message = error?.message ?? 'Image upload failed.';
        setMessage(message);
        pushToast({ tone: 'error', title: 'Image upload failed', message });
        return;
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) throw new Error('Upload response missing URL.');
      setForm((current) => ({ ...current, [targetField]: payload.url }));
      setMessage('Image uploaded and preview updated.');
      pushToast({ tone: 'success', title: 'Image uploaded', message: 'The asset is ready to save.' });
    } catch {
      const message = 'Image upload failed.';
      setMessage(message);
      pushToast({ tone: 'error', title: 'Image upload failed', message });
    } finally {
      setUploadingAsset(null);
    }
  }

  async function applyTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Saving branding...');
    const response = await fetch('/admin/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themePresetId: presetId,
        layoutConfig: {
          nav: form.nav,
          navSticky: form.navSticky,
          navTransparency: form.navTransparency,
          navUnderlineHover: form.navUnderlineHover,
          navBrandSlot: form.navBrandSlot,
          navRightText: form.navRightText,
          navLinks: form.navLinks,
          navSocialLinks: form.navSocialLinks.map((item) => item.href),
          navHeight: form.navHeight,
          menuDefaults: {
            fontFamily: emptyStringToUndefined(form.menuFontFamily),
            color: normalizeColor(form.menuFontColor) ?? undefined,
            fontSize: emptyStringToUndefined(form.menuFontSize),
            interline: emptyStringToUndefined(form.menuInterline),
            itemGap: emptyStringToUndefined(form.menuItemGap),
            margin: emptyStringToUndefined(form.menuMargin),
            padding: emptyStringToUndefined(form.menuPadding),
          },
          hero: form.hero,
          contentWidth: form.contentWidth,
          sectionRhythm: form.sectionRhythm,
          sectionDivider: form.sectionBorder,
          headerSpacing: form.headerSpacing,
          surfaceStyle: form.cardStyle,
          surfaceRadius: form.cardRadius,
          logotype: form.logotype,
          blockDefaults: {
            textStyle: {
              fontFamily: emptyStringToUndefined(form.blockFontFamily),
              color: normalizeColor(form.blockFontColor) ?? undefined,
              fontSize: cssLengthFromInput(form.blockFontSize, '18px'),
            },
            spacing: {
              margin: emptyStringToUndefined(form.blockMargin),
              padding: emptyStringToUndefined(form.blockPadding),
              interline: emptyStringToUndefined(form.blockInterline),
            },
          },
        },
        logoUrl: normalizeUrl(form.logoUrl),
        faviconUrl: normalizeUrl(form.faviconUrl),
        themeOverrides: buildThemeOverrides(form),
      }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      const errorMessage = error?.message ?? 'Please try again.';
      setMessage(`Branding could not be saved: ${errorMessage}`);
      pushToast({ tone: 'error', title: 'Branding not saved', message: errorMessage });
      return;
    }

    const saved = (await response.json().catch(() => null)) as { logoUrl?: string | null; faviconUrl?: string | null } | null;
    if (saved) {
      setForm((current) => ({ ...current, logoUrl: saved.logoUrl ?? '', faviconUrl: saved.faviconUrl ?? '' }));
    }

    setMessage('Branding saved for this tenant.');
    pushToast({ tone: 'success', title: 'Branding updated', message: 'The public website will use the new settings.' });
    startTransition(() => router.refresh());
  }

  return (
    <section className="theme-editor-layout">
      <form className="theme-switcher" aria-label="Branding and layout editor" onSubmit={applyTheme}>
        <div className="branding-section-header">
          <div>
            <p className="section-kicker">Branding</p>
            <h3>Visual identity</h3>
            <p className="form-help">Choose the colors, fonts, width, and image assets that should drive the public website.</p>
          </div>
          <div className="branding-inline-help">
            <span>Live preview enabled</span>
            <span>Optional settings only</span>
          </div>
        </div>

        <div className="theme-switcher-grid">
          <label>
            Color palette
            <select name="themePreset" value={presetId} onChange={(event) => setPresetId(event.target.value)}>
              {themePresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Navigation
            <select name="nav" value={form.nav} onChange={(event) => setField('nav', event.target.value)}>
              {navOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <details className="branding-details" open>
            <summary>Menu bar</summary>
            <fieldset className="layout-tuning-group layout-tuning-group--full">
            <label>
              Menu height
              <select name="navHeight" value={form.navHeight} onChange={(event) => setField('navHeight', event.target.value)}>
                {navHeightOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sticky menu
              <select name="navSticky" value={form.navSticky ? 'sticky' : 'static'} onChange={(event) => setField('navSticky', event.target.value === 'sticky')}>
                {navStickyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Transparency
              <select name="navTransparency" value={form.navTransparency} onChange={(event) => setField('navTransparency', event.target.value)}>
                {navTransparencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle-field">
              <input type="checkbox" checked={form.navUnderlineHover} onChange={(event) => setField('navUnderlineHover', event.target.checked)} />
              <span>Underline on hover</span>
            </label>
            <label>
              Left corner brand
              <select name="navBrandSlot" value={form.navBrandSlot} onChange={(event) => setField('navBrandSlot', event.target.value)}>
                {navBrandSlotOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Right corner text
              <input value={form.navRightText} onChange={(event) => setField('navRightText', event.target.value)} placeholder="Optional menu note" />
            </label>
            <NavLinksEditor label="Menu items" items={form.navLinks} onChange={(items) => setField('navLinks', items)} />
            <SocialLinksEditor label="Social buttons" items={form.navSocialLinks} onChange={(items) => setField('navSocialLinks', items)} />
            {showAdvancedControls ? (
              <label>
                Menu item spacing
                <input type="number" min="0" step="1" value={form.menuItemGap} onChange={(event) => setField('menuItemGap', event.target.value)} />
              </label>
            ) : null}
          </fieldset>
          </details>

          {showAdvancedControls ? (
            <details className="branding-details" open>
              <summary>Menu typography</summary>
              <fieldset className="layout-tuning-group layout-tuning-group--full">
              <label>
                Menu font
                <select value={form.menuFontFamily} onChange={(event) => setField('menuFontFamily', event.target.value)}>
                  <option value="">Default</option>
                  {fontOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Menu font color
                <input type="color" value={normalizeColor(form.menuFontColor) ?? '#10233A'} onChange={(event) => setField('menuFontColor', event.target.value)} />
              </label>
              <label>
                Menu font size
                <select value={form.menuFontSize} onChange={(event) => setField('menuFontSize', event.target.value)}>
                  {blockSizeOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Menu interline
                <select value={form.menuInterline} onChange={(event) => setField('menuInterline', event.target.value)}>
                  {blockInterlineOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Menu margin
                <select value={form.menuMargin} onChange={(event) => setField('menuMargin', event.target.value)}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Menu padding
                <select value={form.menuPadding} onChange={(event) => setField('menuPadding', event.target.value)}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            </details>
          ) : null}

          <label>
            Hero style
            <select name="hero" value={form.hero} onChange={(event) => setField('hero', event.target.value)}>
              {heroOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="layout-tuning-group">
            <legend>Layout tuning</legend>
            <label>
              Side margins
              <select name="contentWidth" value={form.contentWidth} onChange={(event) => setField('contentWidth', event.target.value)}>
                {contentWidthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Section rhythm
              <select name="sectionRhythm" value={form.sectionRhythm} onChange={(event) => setField('sectionRhythm', event.target.value)}>
                {rhythmOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Header spacing
              <select name="headerSpacing" value={form.headerSpacing} onChange={(event) => setField('headerSpacing', event.target.value)}>
                {headerSpacingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Section dividers
              <select name="sectionBorder" value={form.sectionBorder} onChange={(event) => setField('sectionBorder', event.target.value)}>
                {sectionBorderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="layout-tuning-group">
            <legend>Surface treatment</legend>
            <label>
              Surface style
              <select name="cardStyle" value={form.cardStyle} onChange={(event) => setField('cardStyle', event.target.value)}>
                {cardOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Surface corners
              <select name="cardRadius" value={form.cardRadius} onChange={(event) => setField('cardRadius', event.target.value as ThemeCardRadius)}>
                {cardRadiusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>


          <label>
            Logotype text
            <input name="logotype" value={form.logotype} onChange={(event) => setField('logotype', event.target.value)} />
          </label>

          <div className="image-field">
            <ImageField
              label="Logo"
              value={form.logoUrl}
              previewSrc={form.logoUrl}
              placeholder="https://..."
              onTextChange={(value) => setField('logoUrl', value)}
              onFileChange={(file) => void uploadBrandingAsset(file, 'logoUrl', 'logo')}
              onClear={() => setField('logoUrl', '')}
              isUploading={uploadingAsset === 'logoUrl'}
            />
          </div>

          <div className="image-field">
            <ImageField
              label="Favicon"
              value={form.faviconUrl}
              previewSrc={form.faviconUrl}
              placeholder="https://..."
              onTextChange={(value) => setField('faviconUrl', value)}
              onFileChange={(file) => void uploadBrandingAsset(file, 'faviconUrl', 'favicon')}
              onClear={() => setField('faviconUrl', '')}
              isUploading={uploadingAsset === 'faviconUrl'}
            />
          </div>

          {showAdvancedControls ? (
            <>
              <FontSlotField label="Body font" value={form.fontSans} color={form.fontSansColor} onValueChange={(value) => setField('fontSans', value)} onColorChange={(value) => setField('fontSansColor', value)} />
              <FontSlotField label="Display font" value={form.fontDisplay} color={form.fontDisplayColor} onValueChange={(value) => setField('fontDisplay', value)} onColorChange={(value) => setField('fontDisplayColor', value)} />
              <FontSlotField label="H1 font" value={form.fontH1} color={form.fontH1Color} placeholder="Fallback to display font" onValueChange={(value) => setField('fontH1', value)} onColorChange={(value) => setField('fontH1Color', value)} />
              <FontSlotField label="H2 font" value={form.fontH2} color={form.fontH2Color} placeholder="Fallback to display font" onValueChange={(value) => setField('fontH2', value)} onColorChange={(value) => setField('fontH2Color', value)} />
              <FontSlotField label="H3 font" value={form.fontH3} color={form.fontH3Color} placeholder="Fallback to display font" onValueChange={(value) => setField('fontH3', value)} onColorChange={(value) => setField('fontH3Color', value)} />
              <FontSlotField label="Paragraph font" value={form.fontParagraph} color={form.fontParagraphColor} placeholder="Fallback to body font" onValueChange={(value) => setField('fontParagraph', value)} onColorChange={(value) => setField('fontParagraphColor', value)} />
            </>
          ) : null}

          {showAdvancedControls ? (
            <details className="branding-details" open>
              <summary>Block defaults</summary>
              <fieldset className="layout-tuning-group layout-tuning-group--full">
              <label>
                Block font
                <select value={form.blockFontFamily} onChange={(event) => setField('blockFontFamily', event.target.value)}>
                  <option value="">Default</option>
                  {fontOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Block font color
                <input type="color" value={normalizeColor(form.blockFontColor) ?? '#10233A'} onChange={(event) => setField('blockFontColor', event.target.value)} />
              </label>
              <label>
                Block font size
                <input type="number" min="8" max="96" step="1" value={fontSizeInputValue(form.blockFontSize, 18)} onChange={(event) => setField('blockFontSize', event.target.value)} />
              </label>
              <label>
                Interline
                <select value={form.blockInterline} onChange={(event) => setField('blockInterline', event.target.value)}>
                  {blockInterlineOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Block margin size
                <select value={form.blockMargin} onChange={(event) => setField('blockMargin', event.target.value)}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Block padding size
                <select value={form.blockPadding} onChange={(event) => setField('blockPadding', event.target.value)}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            </details>
          ) : null}

          <ImageField
            label="Page background image"
            value={form.backgroundImageUrl}
            previewSrc={form.backgroundImageUrl || previewImage}
            placeholder="https://..."
            onTextChange={(value) => setField('backgroundImageUrl', value)}
            onFileChange={(file) => void uploadBrandingAsset(file, 'backgroundImageUrl', 'background')}
            onClear={() => setField('backgroundImageUrl', '')}
            isUploading={uploadingAsset === 'backgroundImageUrl'}
          />

          <ImageField
            label="Card background image"
            value={form.cardBackgroundImageUrl}
            previewSrc={form.cardBackgroundImageUrl}
            placeholder="https://..."
            onTextChange={(value) => setField('cardBackgroundImageUrl', value)}
            onFileChange={(file) => void uploadBrandingAsset(file, 'cardBackgroundImageUrl', 'card-background')}
            onClear={() => setField('cardBackgroundImageUrl', '')}
            isUploading={uploadingAsset === 'cardBackgroundImageUrl'}
          />

          <ImageField
            label="Hero background image"
            value={form.heroBackgroundImageUrl}
            previewSrc={form.heroBackgroundImageUrl || previewImage}
            placeholder="https://..."
            onTextChange={(value) => setField('heroBackgroundImageUrl', value)}
            onFileChange={(file) => void uploadBrandingAsset(file, 'heroBackgroundImageUrl', 'hero-background')}
            onClear={() => setField('heroBackgroundImageUrl', '')}
            isUploading={uploadingAsset === 'heroBackgroundImageUrl'}
          />
        </div>

        <div className="theme-switcher-actions">
          <button type="submit" className="primary-admin-button" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save branding'}
          </button>
          <p className="form-help">{message}</p>
        </div>
      </form>

      <aside className="branding-preview-block" aria-label="Live branding preview">
        <section className="theme-preview" data-theme-preview={theme.id} {...runtimeSurface.dataAttributes} data-card-radius={runtimeLayout.cardRadius} style={style}>
          <div className="preview-brand-row">
            {form.logoUrl ? <img className="preview-logo" src={form.logoUrl} alt="" /> : <div className="preview-logo preview-logo-placeholder">{tenantName.slice(0, 1)}</div>}
            <div>
              <p className="preview-eyebrow">{tenantName}</p>
              <h2 style={{ fontFamily: fontStack(theme.typography.fontDisplay) }}>{theme.name}</h2>
            </div>
          </div>
          <p style={{ fontFamily: fontStack(theme.typography.fontBody ?? theme.typography.fontSans), color: theme.typography.fontBodyColor ?? theme.typography.fontSansColor ?? theme.colors.text }}>Preview card rendered with tenant CSS variables, matching the public runtime branding path.</p>
          <button type="button">Preview primary action</button>
        </section>

        <section className={`live-preview-grid ${runtimeSurface.className}`} {...runtimeSurface.dataAttributes} data-card-radius={runtimeLayout.cardRadius} data-header-spacing={form.headerSpacing} data-nav-height={form.navHeight} style={{ ...style, '--preview-block-padding': previewBlockPadding, '--preview-block-margin': previewBlockMargin, '--preview-nav-margin': previewNavMargin } as CSSProperties}>
          <header
            className={`live-preview-nav live-preview-nav--${runtimeLayout.nav}`}
            data-nav-sticky={runtimeLayout.navSticky ? 'true' : 'false'}
            data-nav-height={form.navHeight}
            data-nav-transparency={form.navTransparency}
            data-nav-underline-hover={form.navUnderlineHover ? 'true' : 'false'}
            data-nav-brand-slot={form.navBrandSlot}
            style={{
              fontFamily: fontStack(form.menuFontFamily || theme.typography.fontSans),
              color: normalizeColor(form.menuFontColor) ?? theme.typography.fontSansColor ?? theme.colors.text,
              fontSize: form.menuFontSize || '0.95rem',
              lineHeight: form.menuInterline || '1.45',
              margin: previewNavMargin,
              padding: form.menuPadding || undefined,
            }}
          >
            <a className="live-preview-brand" href="#" onClick={(event) => event.preventDefault()}>
              {(form.navBrandSlot === 'logo' || form.navBrandSlot === 'both') && form.logoUrl ? <img className="live-preview-brand-mark" src={form.logoUrl} alt="" aria-hidden="true" /> : <span className="live-preview-brand-mark live-preview-brand-mark-placeholder">{tenantName.slice(0, 1)}</span>}
              {form.navBrandSlot !== 'logo' ? (
                <span>
                  <strong style={{ fontFamily: fontStack(theme.typography.fontDisplay), color: theme.typography.fontDisplayColor ?? theme.colors.text }}>{form.logotype || tenantName}</strong>
                  <small style={{ color: theme.typography.fontBodyColor ?? theme.typography.fontSansColor ?? theme.colors.textMuted }}>{theme.layout.template} layout</small>
                </span>
              ) : null}
            </a>
            <nav className="live-preview-nav-links" aria-label="Preview navigation" style={{ gap: cssLengthFromInput(form.menuItemGap, '14px') }}>
              {form.navLinks.map((item) => (
                <a key={`${item.label}-${item.href}`} href="#" onClick={(event) => event.preventDefault()}>
                  {item.label || 'Link'}
                </a>
              ))}
            </nav>
            <div className="live-preview-nav-aside">
              {form.navRightText ? <p className="live-preview-nav-text">{form.navRightText}</p> : null}
              <div className="live-preview-nav-socials">
                {form.navSocialLinks.map((item) => (
                  <a key={item.href} href="#" onClick={(event) => event.preventDefault()} aria-label={inferSocialLabel(item.href)} title={inferSocialLabel(item.href)}>
                    <span aria-hidden="true">{inferSocialIcon(item.href)}</span>
                  </a>
                ))}
              </div>
            </div>
          </header>

          <article className="live-preview-hero" data-header-spacing={form.headerSpacing} style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.22)), ${imageBackground(theme.assets?.heroBackgroundImageUrl || form.heroBackgroundImageUrl || form.backgroundImageUrl)}` }}>
            <div>
              <p className="preview-eyebrow">Homepage hero</p>
              <h3 style={{ fontFamily: fontStack(theme.typography.fontH1 ?? theme.typography.fontDisplay), color: theme.typography.fontH1Color ?? theme.typography.fontDisplayColor ?? theme.colors.text }}>{form.logotype || tenantName}</h3>
              <p style={{ fontFamily: fontStack(theme.typography.fontParagraph ?? theme.typography.fontBody ?? theme.typography.fontSans), color: theme.typography.fontParagraphColor ?? theme.typography.fontBodyColor ?? theme.typography.fontSansColor ?? theme.colors.text }}>{theme.layout.template} · {form.nav} nav · {form.hero} hero · {form.cardRadius} surface corners</p>
            </div>
            <a href="#" onClick={(event) => event.preventDefault()} className="preview-link-button">
              Primary action
            </a>
          </article>

          <div className="live-preview-card-row" data-header-spacing={form.headerSpacing}>
            <PreviewCard title="Content card" subtitle="Card backgrounds, spacing and typography" imageUrl={form.cardBackgroundImageUrl} headingFont={theme.typography.fontH2 ?? theme.typography.fontDisplay} headingColor={theme.typography.fontH2Color ?? theme.typography.fontDisplayColor ?? theme.colors.text} bodyFont={theme.typography.fontBody ?? theme.typography.fontSans} bodyColor={theme.typography.fontBodyColor ?? theme.typography.fontSansColor ?? theme.colors.text}>
              <p>{form.contentWidth === 'full' ? 'full width' : 'side margins on'} · {form.sectionRhythm} rhythm · {form.sectionBorder} dividers</p>
            </PreviewCard>
            <PreviewCard title="Brand details" subtitle="Logo, favicon and type scale" imageUrl={form.logoUrl || form.faviconUrl} headingFont={theme.typography.fontH3 ?? theme.typography.fontDisplay} headingColor={theme.typography.fontH3Color ?? theme.typography.fontDisplayColor ?? theme.colors.text} bodyFont={theme.typography.fontBody ?? theme.typography.fontSans} bodyColor={theme.typography.fontBodyColor ?? theme.typography.fontSansColor ?? theme.colors.text}>
              <p>{form.fontSans} / {form.fontDisplay}</p>
            </PreviewCard>
          </div>
        </section>
      </aside>
    </section>
  );
}

function ImageField({
  label,
  value,
  previewSrc,
  placeholder,
  onTextChange,
  onFileChange,
  onClear,
  isUploading,
}: {
  label: string;
  value: string;
  previewSrc?: string;
  placeholder: string;
  onTextChange: (value: string) => void;
  onFileChange: (file: File) => void;
  onClear: () => void;
  isUploading?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileChange(file);
  }

  return (
    <div
      className="image-field-card"
      data-dragging={isDragging ? 'true' : 'false'}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="image-field-card-header">
        <label>
          {label}
          <input value={value} onChange={(event) => onTextChange(event.target.value)} placeholder={placeholder} />
        </label>
        <div className="image-field-actions">
          <label className="file-upload-button">
            {isUploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onFileChange(event.target.files[0])} />
          </label>
          <button type="button" onClick={onClear} disabled={isUploading}>Clear</button>
        </div>
      </div>
      <div className="image-preview-thumb" style={previewSrc ? { backgroundImage: `url('${escapeCss(previewSrc)}')` } : undefined}>
        {!previewSrc ? <span>Drop an image here or upload/select a URL</span> : <span className="image-preview-overlay">Drop to replace</span>}
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  subtitle,
  imageUrl,
  headingFont,
  headingColor,
  bodyFont,
  bodyColor,
  children,
}: {
  title: string;
  subtitle: string;
  imageUrl?: string;
  headingFont: string;
  headingColor: string;
  bodyFont: string;
  bodyColor: string;
  children: ReactNode;
}) {
  return (
    <article className="live-preview-card" style={imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.76)), url('${escapeCss(imageUrl)}')`, fontFamily: fontStack(bodyFont) } : { fontFamily: fontStack(bodyFont) }}>
      <p className="preview-eyebrow">{subtitle}</p>
      <h4 style={{ fontFamily: fontStack(headingFont), color: headingColor }}>{title}</h4>
      <div style={{ color: bodyColor }}>{children}</div>
    </article>
  );
}

function NavLinksEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: NavLinkItem[];
  onChange: (items: NavLinkItem[]) => void;
}) {
  return (
    <fieldset className="nav-links-editor">
      <legend>{label}</legend>
      {items.length ? null : <p className="form-help">Add one or more links.</p>}
      <div className="nav-links-list">
        {items.map((item, index) => (
          <div key={index} className="nav-link-row">
            <input value={item.label} onChange={(event) => updateNavItem(items, index, 'label', event.target.value, onChange)} placeholder="Label" />
            <input value={item.href} onChange={(event) => updateNavItem(items, index, 'href', event.target.value, onChange)} placeholder="#href or https://" />
            <button type="button" onClick={() => onChange(items.filter((_, current) => current !== index))}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" className="secondary-admin-button" onClick={() => onChange([...items, { label: '', href: '' }])}>
        Add link
      </button>
    </fieldset>
  );
}

function SocialLinksEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: SocialLinkItem[];
  onChange: (items: SocialLinkItem[]) => void;
}) {
  return (
    <fieldset className="nav-links-editor">
      <legend>{label}</legend>
      {items.length ? null : <p className="form-help">Add social profile links only. Icons are inferred automatically.</p>}
      <div className="nav-links-list">
        {items.map((item, index) => (
          <div key={`${item.href}-${index}`} className="nav-link-row nav-link-row--social">
            <input value={item.href} onChange={(event) => updateSocialItem(items, index, event.target.value, onChange)} placeholder="https://instagram.com/..." />
            <button type="button" onClick={() => onChange(items.filter((_, current) => current !== index))}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" className="secondary-admin-button" onClick={() => onChange([...items, { href: '' }])}>
        Add social link
      </button>
    </fieldset>
  );
}

function updateNavItem(items: NavLinkItem[], index: number, key: keyof NavLinkItem, value: string, onChange: (items: NavLinkItem[]) => void) {
  const next = items.map((item, current) => (current === index ? { ...item, [key]: value } : item));
  onChange(next);
}

function updateSocialItem(items: SocialLinkItem[], index: number, value: string, onChange: (items: SocialLinkItem[]) => void) {
  const next = items.map((item, current) => (current === index ? { href: value } : item));
  onChange(next);
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

function FontSlotField({
  label,
  value,
  color,
  onValueChange,
  onColorChange,
  placeholder,
}: {
  label: string;
  value: string;
  color: string;
  onValueChange: (value: string) => void;
  onColorChange: (value: string) => void;
  placeholder?: string;
}) {
  const options = value && !fontOptions.includes(value as (typeof fontOptions)[number]) ? [value, ...fontOptions] : fontOptions;
  return (
    <label className="font-slot-field">
      {label}
      <div className="font-slot-row">
        <select value={value} onChange={(event) => onValueChange(event.target.value)}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input type="color" value={normalizeColor(color) ?? '#10233A'} onChange={(event) => onColorChange(event.target.value)} aria-label={`${label} color`} />
      </div>
    </label>
  );
}

function buildThemeOverrides(form: BrandingFormState): ThemeOverrides {
  return {
    typography: {
      fontSans: form.fontSans || undefined,
      fontSansColor: normalizeColor(form.fontSansColor) ?? undefined,
      fontDisplay: form.fontDisplay || undefined,
      fontDisplayColor: normalizeColor(form.fontDisplayColor) ?? undefined,
      fontH1: form.fontH1 || undefined,
      fontH1Color: normalizeColor(form.fontH1Color) ?? undefined,
      fontH2: form.fontH2 || undefined,
      fontH2Color: normalizeColor(form.fontH2Color) ?? undefined,
      fontH3: form.fontH3 || undefined,
      fontH3Color: normalizeColor(form.fontH3Color) ?? undefined,
      fontBody: form.fontBody || undefined,
      fontBodyColor: normalizeColor(form.fontBodyColor) ?? undefined,
      fontParagraph: form.fontParagraph || undefined,
      fontParagraphColor: normalizeColor(form.fontParagraphColor) ?? undefined,
    },
    layout: {
      navSticky: form.navSticky,
      contentWidth: (form.contentWidth || undefined) as ThemeLayout['contentWidth'] | undefined,
      sectionRhythm: (form.sectionRhythm || undefined) as ThemeLayout['sectionRhythm'] | undefined,
      sectionBorder: (form.sectionBorder || undefined) as ThemeLayout['sectionBorder'] | undefined,
      cardRadius: form.cardRadius || undefined,
    },
    assets: {
      backgroundImageUrl: normalizeUrl(form.backgroundImageUrl) ?? undefined,
      cardBackgroundImageUrl: normalizeUrl(form.cardBackgroundImageUrl) ?? undefined,
      heroBackgroundImageUrl: normalizeUrl(form.heroBackgroundImageUrl) ?? undefined,
    },
  };
}

async function uploadImage(file: File, kind: string): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  return fetch('/admin/uploads', { method: 'POST', body: formData });
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function emptyStringToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeColor(value: string): string | null {
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : null;
}

function cssLengthFromInput(value: string, fallback?: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallback;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

function fontSizeInputValue(value: string, fallback: number): string {
  const trimmed = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;
  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pxMatch) return pxMatch[1] ?? String(fallback);
  const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)rem$/i);
  if (remMatch) return String(Math.round(Number(remMatch[1]) * 16));
  return String(fallback);
}

function normalizeHeaderSpacingSelection(value: string): string {
  return value === 'overlay' ? 'overlay' : 'margin';
}

function normalizeNavHeightSelection(value: string): string {
  return value === 'compact' || value === 'tall' ? value : 'regular';
}

function fontStack(fontName: string): string {
  return `'${fontName.replace(/'/g, "\\'")}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
}

function stringRecordValue(record: Record<string, unknown> | undefined, key: string, fallback: string): string {
  return typeof record?.[key] === 'string' && (record[key] as string).trim().length > 0 ? (record[key] as string) : fallback;
}

function getLayoutBlockDefaults(record: Record<string, unknown> | undefined): Record<string, unknown> {
  const blockDefaults = record?.blockDefaults;
  return blockDefaults && typeof blockDefaults === 'object' && !Array.isArray(blockDefaults) ? (blockDefaults as Record<string, unknown>) : {};
}

function getLayoutMenuDefaults(record: Record<string, unknown> | undefined): Record<string, unknown> {
  const menuDefaults = record?.menuDefaults;
  return menuDefaults && typeof menuDefaults === 'object' && !Array.isArray(menuDefaults) ? (menuDefaults as Record<string, unknown>) : {};
}

function nestedStringRecordValue(record: Record<string, unknown>, path: [string, string], fallback: string): string {
  const section = record[path[0]];
  if (!section || typeof section !== 'object' || Array.isArray(section)) return fallback;
  const value = (section as Record<string, unknown>)[path[1]];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function socialItemsRecordValue(record: Record<string, unknown> | undefined, key: string, fallback: SocialLinkItem[]): SocialLinkItem[] {
  const value = record?.[key];
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim().length > 0 ? { href: item } : null;
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const recordItem = item as Record<string, unknown>;
      const href = typeof recordItem.href === 'string' ? recordItem.href : '';
      return href.trim().length > 0 ? { href } : null;
    })
    .filter((item): item is SocialLinkItem => item !== null);
}

function navItemsRecordValue(record: Record<string, unknown> | undefined, key: string, fallback: NavLinkItem[]): NavLinkItem[] {
  const value = record?.[key];
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const recordItem = item as Record<string, unknown>;
      const label = typeof recordItem.label === 'string' ? recordItem.label : '';
      const href = typeof recordItem.href === 'string' ? recordItem.href : '';
      if (!label.trim() && !href.trim()) return null;
      return { label, href };
    })
    .filter((item): item is NavLinkItem => item !== null);
}

function booleanRecordValue(record: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean {
  const value = record?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeSideMarginsSelection(value: string): 'centered' | 'full' {
  return value === 'full' ? 'full' : 'centered';
}

function stringThemeOverride(record: Record<string, unknown> | undefined, path: [string, string], fallback: string): string {
  const section = record?.[path[0]];
  if (!section || typeof section !== 'object' || Array.isArray(section)) return fallback;
  const value = (section as Record<string, unknown>)[path[1]];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function escapeCss(value: string): string {
  return value.replace(/'/g, "\\'");
}

function imageBackground(url?: string): string {
  return url ? `url('${escapeCss(url)}')` : 'none';
}
