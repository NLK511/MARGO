## Purpose

Render a tenant-branded public website from configurable page blocks.

## Public Routes

```txt
/
/:locale
/:locale/:pageSlug
/t/:tenantSlug   (development alias)
/contact
/services
/team
/locations
/legal/privacy
/legal/terms
```

Canonical public pages are locale-prefixed. The tenant-slug route is kept as a development/compatibility alias.

## Admin Routes

```txt
/tenant/pages
/tenant/pages/:pageId
/tenant/pages/new
/admin/tenant/pages   (API)
/admin/tenant/pages/:pageId   (API)
```

The admin pages section must show both:
- manually created pages (editable)
- module-injected pages (read-only, with their owning module and route path)

## Page Model

```ts
interface PublicPage {
  id: string;
  tenantId: string;
  slug: string;
  locale: string;
  title: string;
  seo: SeoConfig;
  status: 'draft' | 'published';
  layoutPreset: 'classic' | 'split' | 'editorial' | 'dashboard' | 'immersive';
  blocks: PageBlock[];
}

interface PageBlock {
  id: string;
  type: string;
  variant: string;
  props: Record<string, unknown>;
  visibility?: {
    from?: string;
    until?: string;
    audience?: string[];
  };
}
```

## Block Registry

Core block types:
- hero
- service-list
- image
- carousel
- split-media
- rich-text
- location
- contact-form
- cta

Blocks must not render small category labels/tags in the top-left or bottom corners (for example: service, featured, visit) unless a specific block variant explicitly opts into such a label.

Carousel presets (not separate block types):
- cards
- testimonials
- offers
- gallery

Intended usage:
- **hero**: one per page, strongest entry point and CTA
- **service-list**: offerings, menu items, treatments, or pricing-focused lists
- **image**: one visual with optional overlay text and optional call-to-action button
- **carousel**: featured items, testimonials, offers, or compact collections when several items share equal weight
- **split-media**: editorial section with text + one supporting image
- **rich-text**: copy-first sections with minimal structure
- **location**: address, contact, and visit details
- **contact-form**: inquiry form section
- **cta**: single conversion band

Overlap guidance:
- use carousel instead of repeating multiple hero/image sections
- use split-media instead of forcing a hero layout for mid-page editorial content
- use rich-text when structure is simple; prefer service-list or carousel when items need cards or repeated metadata

## Block Text and Spacing Rules

All blocks that render text must support per-block overrides for:

- font family
- font size
- font color
- line height / interline spacing
- margins
- padding

These values should have sensible defaults and be exposed in the editor. Font size uses a numeric input, while text alignment uses buttons for faster editing.

Branding-level typography and spacing tokens may define the defaults for a tenant and must inherit into blocks when a block does not override them.
Block-level settings always win over branding-level defaults.
Navigation item gap rules may also be defined at branding level and apply to the public menu when set.

Overlay text placement rules:

- if two overlay text elements are assigned the same slot (for example, `middle-left`), they must stack on separate lines instead of overlapping
- text layout must wrap naturally within its container
- button rendering is optional for image blocks
- when the image block uses the `cover` variant, the image itself stays full-bleed and does not inherit outer block margins; overlay text and optional buttons still use the block margin as their inset/gutter
- margin presets must progress smoothly from very small to the existing standard size
- menu bar spacing is independent from block margins

## Block Contract

```ts
interface BlockDefinition<TProps> {
  type: string;
  variants: string[];
  schema: ZodSchema<TProps>;
  defaultProps: TProps;
  render: React.ComponentType<TProps>;
  adminEditor: React.ComponentType<BlockEditorProps<TProps>>;
}
```

## Acceptance Criteria

- Tenant can publish homepage.
- Tenant can switch theme preset without content loss.
- Tenant can switch between classic and refined editorial frontpage layouts without content loss.
- The public homepage uses the theme preset as the baseline template and tenant layout settings for fine tuning.
- Tenant can customize branding from the admin UI (logo, favicon, logotype, fonts, background images).
- Image blocks can use uploaded local media or URLs and can contain overlay text.
- Public pages load with tenant branding.
- Public pages work on mobile.
- Missing page returns branded 404.
- SEO metadata is configurable.
- Blocks can include linked buttons when the block variant supports them.
- Image block buttons are optional.
- Page editor can add image-only and split-media blocks.
- Block text settings are edited through one shared control surface across block types.
- Font size is edited as a numeric value.
- Text alignment is edited with buttons.
- Branding sections in the editor can be collapsed to reduce clutter.
- Navigation item spacing can be customized.
- Frontpage-only deployment must not load booking/CRM admin routes.

---

