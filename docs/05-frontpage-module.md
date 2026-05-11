## Purpose

Render a tenant-branded public website from configurable page blocks.

## Public Routes

```txt
/
/:locale
/:locale/:pageSlug
/contact
/services
/team
/locations
/legal/privacy
/legal/terms
```

Routes may be locale-prefixed depending tenant configuration.

## Admin Routes

```txt
/admin/site/pages
/admin/site/pages/:pageId
/admin/site/navigation
/admin/site/brand
/admin/site/assets
/admin/site/seo
```

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
  layoutPreset: string;
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

## Required Block Types

- hero
- service list
- team/provider list
- testimonials
- gallery
- FAQ
- location/map
- contact form
- CTA band
- pricing/menu
- opening hours
- trust badges
- rich text

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
- Public pages load with tenant branding.
- Public pages work on mobile.
- Missing page returns branded 404.
- SEO metadata is configurable.
- Frontpage-only deployment must not load booking/CRM admin routes.

---

