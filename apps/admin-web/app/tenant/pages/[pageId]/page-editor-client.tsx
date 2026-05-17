'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShellCard } from '@margo/ui';
import {
  carouselPresetOptions,
  createCarouselPresetProps,
  createDefaultPageBlockProps,
  getCarouselPresetDefaults,
  getCarouselPresetSlides,
  getPageBlockDefinition,
  getPageBlockOptions,
  type PageBlockType,
} from '@margo/core';
import { useAdminToast } from '../../../admin-toast';

type EditorBlock = {
  id: string;
  type: PageBlockType;
  variant: string;
  props: Record<string, unknown>;
};

const blockTypeOptions = getPageBlockOptions();
const imageVariantOptions = ['cover', 'framed'] as const;
const imageOverlayTagOptions = ['h1', 'h2', 'h3', 'p'] as const;
const imageOverlayPositionOptions = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;
const splitMediaSideOptions = ['image-left', 'image-right'] as const;
const textAlignOptions = ['left', 'center', 'right', 'justify'] as const;
const imageButtonPositionOptions = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;
const imageButtonStyleOptions = ['primary', 'secondary', 'ghost'] as const;
const carouselModeOptions = ['manual', 'auto'] as const;
const carouselStyleOptions = ['snap', 'smooth'] as const;
const defaultFontSizePx = 18;
const fontSizeInputMin = 8;
const fontSizeInputMax = 96;
const blockSpacingOptions = [
  { value: '', label: 'Default' },
  { value: '0', label: 'None' },
  { value: '0.5rem', label: 'XS' },
  { value: '1rem', label: 'SM' },
  { value: '1.5rem', label: 'MD' },
  { value: '2rem', label: 'LG' },
] as const;
const blockInterlineOptions = [
  { value: '', label: 'Default' },
  { value: '1', label: 'Tight' },
  { value: '1.2', label: 'Small' },
  { value: '1.4', label: 'Normal' },
  { value: '1.6', label: 'Loose' },
  { value: '1.8', label: 'Very loose' },
] as const;
const fontOptions = ['Inter', 'Cormorant Garamond', 'Space Grotesk', 'Nunito Sans', 'Playfair Display', 'Bodoni Moda', 'Fraunces', 'Libre Baskerville', 'system-ui', 'serif'] as const;

export function PageEditorClient({
  tenantSlug,
  tenantName,
  pageId,
  initialPage,
  showDebugPanel = false,
}: {
  tenantSlug: string;
  tenantName: string;
  pageId: string;
  initialPage: {
    id: string;
    title: string;
    slug: string;
    locale: string;
    seo: unknown;
    status: string;
    layoutPreset: string;
    blocks: Array<{ id: string; type: string; variant: string; props: unknown }>;
  } | null;
  showDebugPanel?: boolean;
}) {
  const router = useRouter();
  const { pushToast } = useAdminToast();
  const [isPending, startTransition] = useTransition();
  const initialSeo = normalizeSeo(initialPage?.seo);
  const [title, setTitle] = useState(initialPage?.title ?? '');
  const [slug, setSlug] = useState(initialPage?.slug ?? '');
  const [seoTitle, setSeoTitle] = useState(initialSeo.title ?? '');
  const [seoDescription, setSeoDescription] = useState(initialSeo.description ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>((initialPage?.status as 'draft' | 'published' | undefined) ?? 'draft');
  const [newBlockType, setNewBlockType] = useState<PageBlockType>('rich-text');
  const [blocks, setBlocks] = useState<EditorBlock[]>(
    initialPage?.blocks.length
      ? initialPage.blocks.map((block) => ({ id: block.id, type: block.type as PageBlockType, variant: block.variant, props: normalizeProps(block.props) }))
      : [createDefaultBlock(initialPage?.title ?? 'Welcome')],
  );
  const [message, setMessage] = useState('Update the page structure, then save a draft or publish it.');
  const [uploadingCarouselTarget, setUploadingCarouselTarget] = useState<string | null>(null);
  const [uploadingSplitMediaTarget, setUploadingSplitMediaTarget] = useState<number | null>(null);
  const [draggedCarouselSlide, setDraggedCarouselSlide] = useState<string | null>(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(() => new Set());


  function updateBlock(index: number, patch: Partial<EditorBlock>) {
    setBlocks((current) => current.map((block, currentIndex) => (currentIndex === index ? { ...block, ...patch } : block)));
  }

  function addBlock() {
    setBlocks((current) => [...current, createDefaultBlockForType(newBlockType, 'New block')]);
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (!item) return current;
      next.splice(target, 0, item);
      return next;
    });
  }

  async function savePage(nextStatus: 'draft' | 'published') {
    setStatus(nextStatus);
    setMessage(nextStatus === 'published' ? 'Publishing page...' : 'Saving draft...');
    const response = await fetch(pageId === 'new' ? '/admin/tenant/pages' : `/admin/tenant/pages/${pageId}`, {
      method: pageId === 'new' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        seoTitle,
        seoDescription,
        status: nextStatus,
        blocks,
      }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      const errorMessage = error?.message ?? 'Could not save the page.';
      setMessage(errorMessage);
      pushToast({ tone: 'error', title: 'Page not saved', message: errorMessage });
      return;
    }

    const payload = (await response.json()) as { pageId: string };
    setMessage(nextStatus === 'published' ? 'Page published.' : 'Draft saved.');
    pushToast({ tone: 'success', title: nextStatus === 'published' ? 'Page published' : 'Draft saved', message: title || 'Page changes were stored.' });
    startTransition(() => {
      router.refresh();
      if (pageId === 'new' && payload.pageId) {
        router.replace(`/tenant/pages/${payload.pageId}`);
      }
    });
  }

  function toggleBlockCollapsed(blockId: string) {
    setCollapsedBlockIds((current) => {
      const next = new Set(current);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }

  async function uploadCarouselSlideImage(blockIndex: number, slideIndex: number, file: File) {
    const target = `${blockIndex}:${slideIndex}`;
    setUploadingCarouselTarget(target);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('kind', 'carousel-slide');
      const response = await fetch('/admin/uploads', { method: 'POST', body: formData });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        const message = error?.message ?? 'Image upload failed.';
        setMessage(message);
        pushToast({ tone: 'error', title: 'Slide image upload failed', message });
        return;
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) throw new Error('Upload response missing URL.');
      const currentBlock = blocks[blockIndex];
      if (!currentBlock) return;
      const slides = carouselSlidesProp(currentBlock.props, currentBlock.variant);
      updateBlock(blockIndex, {
        props: {
          ...currentBlock.props,
          slides: updateCarouselSlides(slides, slideIndex, { imageUrl: payload.url }),
        },
      });
      setMessage('Slide image uploaded.');
      pushToast({ tone: 'success', title: 'Slide image uploaded', message: 'The image is ready to save.' });
    } catch {
      const message = 'Image upload failed.';
      setMessage(message);
      pushToast({ tone: 'error', title: 'Slide image upload failed', message });
    } finally {
      setUploadingCarouselTarget(null);
    }
  }

  async function uploadSplitMedia(blockIndex: number, file: File) {
    setUploadingSplitMediaTarget(blockIndex);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('kind', file.type.startsWith('video/') ? 'split-media-video' : 'split-media-image');
      const response = await fetch('/admin/uploads', { method: 'POST', body: formData });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        const message = error?.message ?? 'Media upload failed.';
        setMessage(message);
        pushToast({ tone: 'error', title: 'Media upload failed', message });
        return;
      }
      const payload = (await response.json()) as { url?: string; contentType?: string };
      if (!payload.url) throw new Error('Upload response missing URL.');
      const currentBlock = blocks[blockIndex];
      if (!currentBlock) return;
      const isVideo = file.type.startsWith('video/') || payload.contentType?.startsWith('video/');
      updateBlock(blockIndex, {
        props: {
          ...currentBlock.props,
          mediaType: isVideo ? 'video' : 'image',
          ...(isVideo ? { videoUrl: payload.url } : { imageUrl: payload.url }),
        },
      });
      setMessage('Split media uploaded.');
      pushToast({ tone: 'success', title: 'Media uploaded', message: 'The media is ready to save.' });
    } catch {
      const message = 'Media upload failed.';
      setMessage(message);
      pushToast({ tone: 'error', title: 'Media upload failed', message });
    } finally {
      setUploadingSplitMediaTarget(null);
    }
  }

  return (
    <section className="admin-stack">
      <ShellCard eyebrow="Frontpage" title={pageId === 'new' ? `Create ${tenantName} page` : `Edit ${tenantName} page`}>
        <p>Tenant-scoped page content, SEO metadata, publication state, and block ordering.</p>
        <p className="form-help">Tenant: {tenantSlug}</p>
      </ShellCard>

      <form className="editor-form" aria-label="Page editor" onSubmit={(event) => event.preventDefault()}>
        <label>
          Page title
          <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Slug
          <input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
        </label>
        <label>
          SEO title
          <input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
        </label>
        <label>
          SEO description
          <textarea name="seoDescription" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
        </label>
        <label>
          Publication status
          <select name="status" value={status} onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>

        <fieldset>
          <legend>Page structure</legend>
          <div className="page-structure-actions">
            <label>
              New block type
              <select value={newBlockType} onChange={(event) => setNewBlockType(event.target.value as PageBlockType)}>
                {blockTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} title={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="primary-admin-button" onClick={addBlock}>
              Add block
            </button>
          </div>

          <div className="block-editor-list">
            {blocks.map((block, index) => {
              const isCollapsed = collapsedBlockIds.has(block.id);
              const definition = getPageBlockDefinition(block.type);
              return (
              <article key={block.id} className="block-editor-card page-block-editor-card" data-collapsed={isCollapsed ? 'true' : 'false'}>
                <header className="block-editor-header">
                  <div>
                    <p className="form-help">Block {index + 1}</p>
                    <h3>{definition?.label ?? block.type}</h3>
                    <p className="form-help">{definition?.intendedUse ?? definition?.description ?? 'Page section'}</p>
                  </div>
                  <button type="button" className="secondary-admin-button" onClick={() => toggleBlockCollapsed(block.id)} aria-expanded={!isCollapsed}>
                    {isCollapsed ? 'Expand' : 'Minimize'}
                  </button>
                </header>
                {!isCollapsed ? <div className="block-editor-body">
                <div className="block-editor-row">
                  <label>
                    Block type
                    <select
                      value={block.type}
                      onChange={(event) => {
                        const nextType = event.target.value as PageBlockType;
                        updateBlock(index, {
                          type: nextType,
                          variant: getPageBlockDefinition(nextType)?.defaultVariant ?? 'default',
                          props: createDefaultPageBlockProps(nextType, initialPage?.title ?? 'Featured content'),
                        });
                      }}
                    >
                      {blockTypeOptions.map((option) => (
                        <option key={option.value} value={option.value} title={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Variant
                    {block.type === 'carousel' ? (
                      <select
                        value={block.variant}
                        onChange={(event) => updateBlock(index, { variant: event.target.value, props: createCarouselPresetProps(event.target.value, block.props) })}
                      >
                        {carouselPresetOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : block.type === 'image' ? (
                      <select value={block.variant} onChange={(event) => updateBlock(index, { variant: event.target.value })}>
                        {imageVariantOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : block.type === 'split-media' ? (
                      <select value={block.variant} onChange={(event) => updateBlock(index, { variant: event.target.value, props: { ...block.props, mediaSide: event.target.value } })}>
                        {splitMediaSideOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input value={block.variant} onChange={(event) => updateBlock(index, { variant: event.target.value })} />
                    )}
                  </label>
                </div>

                {renderBlockFields(block, index, updateBlock, uploadCarouselSlideImage, uploadSplitMedia, uploadingCarouselTarget, uploadingSplitMediaTarget, draggedCarouselSlide, setDraggedCarouselSlide)}

                <div className="page-structure-actions block-editor-footer-actions">
                  <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                    Move up
                  </button>
                  <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>
                    Move down
                  </button>
                  <button type="button" onClick={() => removeBlock(index)}>
                    Remove
                  </button>
                </div>
                </div> : null}
              </article>
              );
            })}
          </div>
        </fieldset>

        <div className="page-editor-actions">
          <button type="button" className="primary-admin-button" onClick={() => savePage('draft')} disabled={isPending}>
            Save draft
          </button>
          <button type="button" className="primary-admin-button" onClick={() => savePage('published')} disabled={isPending}>
            Publish
          </button>
        </div>
      </form>

      {showDebugPanel ? (
        <ShellCard eyebrow="Status" title="Editor state">
          <p>{message}</p>
          <p className="form-help">Serialized block state is only shown in debug mode.</p>
        </ShellCard>
      ) : (
        <ShellCard eyebrow="Status" title="Editor state">
          <p>{message}</p>
        </ShellCard>
      )}
    </section>
  );
}

function renderBlockFields(
  block: EditorBlock,
  index: number,
  updateBlock: (index: number, patch: Partial<EditorBlock>) => void,
  uploadCarouselSlideImage: (blockIndex: number, slideIndex: number, file: File) => Promise<void>,
  uploadSplitMedia: (blockIndex: number, file: File) => Promise<void>,
  uploadingCarouselTarget: string | null,
  uploadingSplitMediaTarget: number | null,
  draggedCarouselSlide: string | null,
  setDraggedCarouselSlide: (value: string | null) => void,
) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="page-structure-actions">
          <label>
            Eyebrow
            <input value={stringProp(block.props, 'eyebrow', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, eyebrow: event.target.value } })} />
          </label>
          <label>
            Headline
            <input value={stringProp(block.props, 'headline', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, headline: event.target.value } })} />
          </label>
          <label>
            Body
            <textarea value={stringProp(block.props, 'body', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, body: event.target.value } })} />
          </label>
          <label>
            CTA label
            <input value={stringProp(block.props, 'ctaLabel', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, ctaLabel: event.target.value } })} />
          </label>
          {renderBlockAppearanceFields(block, index, updateBlock)}
        </div>
      );
    case 'service-list':
    case 'location':
    case 'rich-text':
    case 'cta':
    case 'contact-form':
      return (
        <div className="page-structure-actions">
          <label>
            Title
            <input value={stringProp(block.props, 'title', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, title: event.target.value } })} />
          </label>
          <details>
            <summary>Title text</summary>
            {renderTextSettingsPanel({
              title: 'Title text',
              textStyle: titleTextStyleProps(block.props),
              onTextStyleChange: (patch) => updateBlock(index, { props: updateTitleTextStyle(block.props, patch) }),
              onTextAlignChange: (value) => updateBlock(index, { props: updateTitleTextStyle(block.props, { textAlign: value }) }),
              showSpacing: false,
            })}
          </details>
          <label>
            Body
            <textarea value={stringProp(block.props, 'body', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, body: event.target.value } })} />
          </label>
          {renderBlockAppearanceFields(block, index, updateBlock)}
        </div>
      );
    case 'image':
      return (
        <div className="page-structure-actions">
          <label>
            Image URL
            <input value={stringProp(block.props, 'imageUrl', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, imageUrl: event.target.value } })} />
          </label>
          <label>
            Alt text
            <input value={stringProp(block.props, 'alt', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, alt: event.target.value } })} />
          </label>
          <label>
            Caption
            <input value={stringProp(block.props, 'caption', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, caption: event.target.value } })} />
          </label>

          <fieldset>
            <legend>Image button</legend>
            <div className="block-editor-row">
              <label>
                Enabled
                <select value={booleanProp(block.props, 'buttonEnabled') ? 'true' : 'false'} onChange={(event) => updateBlock(index, { props: { ...block.props, buttonEnabled: event.target.value === 'true' } })}>
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </label>
              <label>
                Label
                <input value={stringProp(block.props, 'buttonLabel', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, buttonLabel: event.target.value } })} />
              </label>
              <label>
                Link
                <input value={stringProp(block.props, 'buttonHref', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, buttonHref: event.target.value } })} />
              </label>
            </div>
            <div className="block-editor-row">
              <label>
                Position
                <select value={stringProp(block.props, 'buttonPosition', 'bottom-right')} onChange={(event) => updateBlock(index, { props: { ...block.props, buttonPosition: event.target.value } })}>
                  {imageButtonPositionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Style
                <select value={stringProp(block.props, 'buttonStyle', 'primary')} onChange={(event) => updateBlock(index, { props: { ...block.props, buttonStyle: event.target.value } })}>
                  {imageButtonStyleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {renderTextSettingsPanel({
              title: 'Button text',
              textStyle: buttonTextStyleProps(block.props),
              onTextStyleChange: (patch) => updateBlock(index, { props: updateButtonTextStyle(block.props, patch) }),
              onTextAlignChange: (value) => updateBlock(index, { props: updateButtonTextStyle(block.props, { textAlign: value }) }),
              spacing: buttonSpacingProps(block.props),
              onSpacingChange: (patch) => updateBlock(index, { props: updateButtonSpacing(block.props, patch) }),
              showSpacing: true,
            })}
            <div className="block-editor-row">
              <label>
                Margin
                <select value={buttonSpacingProps(block.props).margin} onChange={(event) => updateBlock(index, { props: updateButtonSpacing(block.props, { margin: event.target.value }) })}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Padding
                <select value={buttonSpacingProps(block.props).padding} onChange={(event) => updateBlock(index, { props: updateButtonSpacing(block.props, { padding: event.target.value }) })}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Overlay text</legend>
            <div className="page-structure-actions">
              <button
                type="button"
                onClick={() =>
                  updateBlock(index, {
                    props: {
                      ...block.props,
                      overlays: [...overlayItemsProp(block.props), createDefaultOverlayItem()],
                    },
                  })
                }
              >
                Add overlay
              </button>
            </div>
            <div className="block-editor-list">
              {overlayItemsProp(block.props).map((overlay, overlayIndex) => (
                <article key={overlay.id} className="block-editor-card">
                  <div className="block-editor-row">
                    <label>
                      Text
                      <input
                        value={overlay.text}
                        onChange={(event) =>
                          updateBlock(index, {
                            props: {
                              ...block.props,
                              overlays: updateOverlayItems(block.props, overlayIndex, { text: event.target.value }),
                            },
                          })
                        }
                      />
                    </label>
                    <label>
                      Tag
                      <select
                        value={overlay.tag}
                        onChange={(event) =>
                          updateBlock(index, {
                            props: {
                              ...block.props,
                              overlays: updateOverlayItems(block.props, overlayIndex, { tag: event.target.value as 'h1' | 'h2' | 'h3' | 'p' }),
                            },
                          })
                        }
                      >
                        {imageOverlayTagOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Position
                      <select
                        value={overlay.position}
                        onChange={(event) =>
                          updateBlock(index, {
                            props: {
                              ...block.props,
                              overlays: updateOverlayItems(block.props, overlayIndex, { position: event.target.value }),
                            },
                          })
                        }
                      >
                        {imageOverlayPositionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="block-editor-row">
                    <label>
                      Framed
                      <select
                        value={overlay.framed ? 'true' : 'false'}
                        onChange={(event) =>
                          updateBlock(index, {
                            props: {
                              ...block.props,
                              overlays: updateOverlayItems(block.props, overlayIndex, { framed: event.target.value === 'true' }),
                            },
                          })
                        }
                      >
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(index, {
                          props: {
                            ...block.props,
                            overlays: overlayItemsProp(block.props).filter((_, currentIndex) => currentIndex !== overlayIndex),
                          },
                        })
                      }
                    >
                      Remove overlay
                    </button>
                  </div>

                  <details>
                    <summary>Text and spacing</summary>
                    {renderTextSettingsPanel({
                      title: 'Overlay text',
                      textStyle: overlay.textStyle,
                      onTextStyleChange: (patch) =>
                        updateBlock(index, {
                          props: {
                            ...block.props,
                            overlays: updateOverlayTextStyle(block.props, overlayIndex, patch),
                          },
                        }),
                      onTextAlignChange: (value) =>
                        updateBlock(index, {
                          props: {
                            ...block.props,
                            overlays: updateOverlayTextStyle(block.props, overlayIndex, { textAlign: value }),
                          },
                        }),
                      spacing: overlay.spacing,
                      onSpacingChange: (patch) =>
                        updateBlock(index, {
                          props: {
                            ...block.props,
                            overlays: updateOverlaySpacing(block.props, overlayIndex, patch),
                          },
                        }),
                      showSpacing: true,
                    })}
                  </details>
                </article>
              ))}
            </div>
          </fieldset>
          {renderBlockAppearanceFields(block, index, updateBlock)}
        </div>
      );
    case 'split-media':
      return (
        <div className="page-structure-actions split-media-editor-fields">
          <label>
            Title
            <input value={stringProp(block.props, 'title', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, title: event.target.value } })} />
          </label>
          <label>
            Text section title
            <input value={stringProp(block.props, 'textTitle', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, textTitle: event.target.value } })} />
          </label>
          <details>
            <summary>Title text</summary>
            {renderTextSettingsPanel({
              title: 'Title text',
              textStyle: titleTextStyleProps(block.props),
              onTextStyleChange: (patch) => updateBlock(index, { props: updateTitleTextStyle(block.props, patch) }),
              onTextAlignChange: (value) => updateBlock(index, { props: updateTitleTextStyle(block.props, { textAlign: value }) }),
              showSpacing: false,
            })}
          </details>
          <label>
            Body
            <textarea value={stringProp(block.props, 'body', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, body: event.target.value } })} />
          </label>
          <label>
            Media type
            <select value={stringProp(block.props, 'mediaType', 'image')} onChange={(event) => updateBlock(index, { props: { ...block.props, mediaType: event.target.value } })}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>
            Image URL
            <input value={stringProp(block.props, 'imageUrl', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, imageUrl: event.target.value, mediaType: 'image' } })} />
          </label>
          <label>
            Video URL
            <input value={stringProp(block.props, 'videoUrl', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, videoUrl: event.target.value, mediaType: 'video' } })} />
          </label>
          <label>
            Alt / accessibility text
            <input value={stringProp(block.props, 'alt', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, alt: event.target.value } })} />
          </label>
          <label>
            Upload image or video
            <input
              type="file"
              accept="image/*,video/*"
              disabled={uploadingSplitMediaTarget === index}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadSplitMedia(index, file);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <p className="form-help">Use the Variant control above to choose image-left or image-right. This avoids duplicating media-side controls.</p>

          <details>
            <summary>Text section</summary>
            {renderTextSettingsPanel({
              title: 'Text settings',
              textStyle: splitMediaTextStyleProps(block.props),
              onTextStyleChange: (patch) => updateBlock(index, { props: updateSplitMediaTextStyle(block.props, patch) }),
              onTextAlignChange: (value) => updateBlock(index, { props: updateSplitMediaTextStyle(block.props, { textAlign: value }) }),
              spacing: splitMediaTextSpacingProps(block.props),
              onSpacingChange: (patch) => updateBlock(index, { props: updateSplitMediaTextSpacing(block.props, patch) }),
              showSpacing: true,
            })}
          </details>

          <details>
            <summary>Media section</summary>
            <div className="block-editor-row">
              <label>
                Margin
                <select value={splitMediaMediaSpacingProps(block.props).margin} onChange={(event) => updateBlock(index, { props: updateSplitMediaMediaSpacing(block.props, { margin: event.target.value }) })}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Padding
                <select value={splitMediaMediaSpacingProps(block.props).padding} onChange={(event) => updateBlock(index, { props: updateSplitMediaMediaSpacing(block.props, { padding: event.target.value }) })}>
                  {blockSpacingOptions.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        </div>
      );
    case 'carousel': {
      const slides = carouselSlidesProp(block.props, block.variant);
      return (
        <div className="page-structure-actions">
          <label>
            Title
            <input value={stringProp(block.props, 'title', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, title: event.target.value } })} />
          </label>
          <label>
            Body
            <textarea value={stringProp(block.props, 'body', '')} onChange={(event) => updateBlock(index, { props: { ...block.props, body: event.target.value } })} />
          </label>
          <label>
            Visible items
            <input type="number" min={1} max={4} value={numberProp(block.props, 'visibleCount', getCarouselPresetDefaults(block.variant).visibleCount)} onChange={(event) => updateBlock(index, { props: { ...block.props, visibleCount: clampNumber(event.target.value, 1, 4, getCarouselPresetDefaults(block.variant).visibleCount) } })} />
          </label>
          <label>
            Mode
            <select value={stringProp(block.props, 'scrollMode', getCarouselPresetDefaults(block.variant).scrollMode)} onChange={(event) => updateBlock(index, { props: { ...block.props, scrollMode: event.target.value } })}>
              {carouselModeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Style
            <select value={stringProp(block.props, 'scrollStyle', getCarouselPresetDefaults(block.variant).scrollStyle)} onChange={(event) => updateBlock(index, { props: { ...block.props, scrollStyle: event.target.value } })}>
              {carouselStyleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {renderBlockAppearanceFields(block, index, updateBlock)}
          <label>
            Slides preset
            <select value={block.variant} onChange={(event) => updateBlock(index, { variant: event.target.value, props: createCarouselPresetProps(event.target.value, block.props) })}>
              {carouselPresetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>Slides</legend>
            <p className="form-help">Drag slide cards to reorder them. Uploads are optional and saved per slide.</p>
            <div className="page-structure-actions">
              <button type="button" onClick={() => updateBlock(index, { props: { ...block.props, slides: [...slides, createCarouselSlide(block.variant, slides.length)] } })}>
                Add slide
              </button>
              <button type="button" onClick={() => updateBlock(index, { props: { ...block.props, slides: slides.slice(0, 1) } })} disabled={slides.length <= 1}>
                Keep first slide only
              </button>
            </div>
            <div className="block-editor-list">
              {slides.map((slide, slideIndex) => {
                const slideKey = `${index}:${slideIndex}`;
                const isDragging = draggedCarouselSlide === slideKey;
                const isUploading = uploadingCarouselTarget === slideKey;
                return (
                  <article
                    key={`${slide.title}-${slideIndex}`}
                    className="block-editor-card carousel-slide-editor"
                    draggable
                    data-dragging={isDragging ? 'true' : 'false'}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', slideKey);
                      setDraggedCarouselSlide(slideKey);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fromKey = event.dataTransfer.getData('text/plain') || draggedCarouselSlide;
                      if (!fromKey || fromKey === slideKey) return;
                      const [fromBlockIndexStr, fromSlideIndexStr] = fromKey.split(':');
                      const fromBlockIndex = Number.parseInt(fromBlockIndexStr ?? '', 10);
                      const fromSlideIndex = Number.parseInt(fromSlideIndexStr ?? '', 10);
                      if (fromBlockIndex !== index || Number.isNaN(fromSlideIndex)) return;
                      updateBlock(index, { props: { ...block.props, slides: reorderCarouselSlides(slides, fromSlideIndex, slideIndex) } });
                      setDraggedCarouselSlide(null);
                    }}
                    onDragEnd={() => setDraggedCarouselSlide(null)}
                  >
                    <div className="block-editor-row">
                      <label>
                        Title
                        <input value={slide.title} onChange={(event) => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { title: event.target.value }) } })} />
                      </label>
                      <label>
                        Eyebrow
                        <input value={slide.eyebrow ?? ''} onChange={(event) => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { eyebrow: event.target.value }) } })} />
                      </label>
                    </div>
                    <label>
                      Body
                      <textarea value={slide.body ?? ''} onChange={(event) => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { body: event.target.value }) } })} />
                    </label>
                    <div className="block-editor-row">
                      <label>
                        Image URL
                        <input value={slide.imageUrl ?? ''} onChange={(event) => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { imageUrl: event.target.value }) } })} />
                      </label>
                      <label>
                        Upload image
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadCarouselSlideImage(index, slideIndex, file);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <div className="block-editor-row">
                      <label>
                        CTA label
                        <input value={slide.ctaLabel ?? ''} onChange={(event) => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { ctaLabel: event.target.value }) } })} />
                      </label>
                      <label>
                        CTA link
                        <input value={slide.ctaHref ?? ''} onChange={(event) => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { ctaHref: event.target.value }) } })} />
                      </label>
                    </div>
                    <div className="page-structure-actions">
                      <button type="button" onClick={() => updateBlock(index, { props: { ...block.props, slides: moveCarouselSlide(slides, slideIndex, -1) } })} disabled={slideIndex === 0}>
                        Move up
                      </button>
                      <button type="button" onClick={() => updateBlock(index, { props: { ...block.props, slides: moveCarouselSlide(slides, slideIndex, 1) } })} disabled={slideIndex === slides.length - 1}>
                        Move down
                      </button>
                      <button type="button" onClick={() => updateBlock(index, { props: { ...block.props, slides: slides.filter((_, currentIndex) => currentIndex !== slideIndex) } })} disabled={slides.length <= 1}>
                        Remove slide
                      </button>
                      {slide.imageUrl ? (
                        <button type="button" onClick={() => updateBlock(index, { props: { ...block.props, slides: updateCarouselSlides(slides, slideIndex, { imageUrl: '' }) } })}>
                          Clear image
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </fieldset>
        </div>
      );
    }
    default:
      return null;
  }
}

function renderBlockAppearanceFields(block: EditorBlock, index: number, updateBlock: (index: number, patch: Partial<EditorBlock>) => void) {
  return renderTextSettingsPanel({
    title: 'Text and spacing',
    textStyle: blockTextStyleProps(block.props),
    onTextStyleChange: (patch) => updateBlock(index, { props: updateBlockTextStyle(block.props, patch) }),
    onTextAlignChange: (value) => updateBlock(index, { props: updateBlockTextStyle(block.props, { textAlign: value }) }),
    spacing: blockSpacingProps(block.props),
    onSpacingChange: (patch) => updateBlock(index, { props: updateBlockSpacing(block.props, patch) }),
    showSpacing: true,
  });
}

function renderTextSettingsPanel({
  title,
  textStyle,
  spacing,
  onTextStyleChange,
  onTextAlignChange,
  onSpacingChange,
  showSpacing,
}: {
  title: string;
  textStyle: { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string };
  spacing?: { margin: string; padding: string; interline?: string };
  onTextStyleChange: (patch: Partial<{ fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }>) => void;
  onTextAlignChange: (value: string) => void;
  onSpacingChange?: (patch: Partial<{ margin: string; padding: string; interline: string }>) => void;
  showSpacing: boolean;
}) {
  return (
    <fieldset className="text-settings-panel">
      <legend>{title}</legend>
      <div className="text-settings-grid">
        <label>
          Font family
          <select value={textStyle.fontFamily} onChange={(event) => onTextStyleChange({ fontFamily: event.target.value })}>
            <option value="">Default</option>
            {fontOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Font color
          <input type="color" value={normalizeColor(textStyle.color) ?? '#10233A'} onChange={(event) => onTextStyleChange({ color: event.target.value })} />
        </label>
        <label>
          Font size
          <input type="number" min={fontSizeInputMin} max={fontSizeInputMax} step={1} value={fontSizeFieldValue(textStyle.fontSize, defaultFontSizePx)} onChange={(event) => onTextStyleChange({ fontSize: event.target.value })} />
        </label>
        <label>
          Interline
          <select value={textStyle.lineHeight} onChange={(event) => onTextStyleChange({ lineHeight: event.target.value })}>
            {blockInterlineOptions.map((option) => (
              <option key={option.value || 'default'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="text-align-controls" role="group" aria-label={`${title} alignment`}>
        <span className="text-align-controls-label">Text align</span>
        <div className="text-align-button-group">
          <button type="button" data-active={textStyle.textAlign === '' ? 'true' : 'false'} onClick={() => onTextAlignChange('')}>
            Default
          </button>
          {textAlignOptions.map((option) => (
            <button key={option} type="button" data-active={textStyle.textAlign === option ? 'true' : 'false'} onClick={() => onTextAlignChange(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>
      {showSpacing && spacing && onSpacingChange ? (
        <div className="text-settings-grid text-settings-grid--spacing">
          <label>
            Margin
            <select value={spacing.margin} onChange={(event) => onSpacingChange({ margin: event.target.value })}>
              {blockSpacingOptions.map((option) => (
                <option key={option.value || 'default'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Padding
            <select value={spacing.padding} onChange={(event) => onSpacingChange({ padding: event.target.value })}>
              {blockSpacingOptions.map((option) => (
                <option key={option.value || 'default'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {typeof spacing.interline === 'string' ? (
            <label>
              Interline spacing
              <select value={spacing.interline} onChange={(event) => onSpacingChange({ interline: event.target.value })}>
                {blockInterlineOptions.map((option) => (
                  <option key={option.value || 'default'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}

function blockTextStyleProps(props: Record<string, unknown>): { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string } {
  const textStyle = isRecord(props.textStyle) ? props.textStyle : props;
  return {
    fontFamily: stringProp(textStyle, 'fontFamily', ''),
    color: stringProp(textStyle, 'color', ''),
    fontSize: fontSizeFieldValue(stringProp(textStyle, 'fontSize', ''), defaultFontSizePx),
    lineHeight: stringProp(textStyle, 'lineHeight', '1.6'),
    textAlign: stringProp(textStyle, 'textAlign', ''),
  };
}

function titleTextStyleProps(props: Record<string, unknown>): { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string } {
  const textStyle = isRecord(props.titleTextStyle) ? props.titleTextStyle : {};
  return {
    fontFamily: stringProp(textStyle, 'fontFamily', ''),
    color: stringProp(textStyle, 'color', ''),
    fontSize: fontSizeFieldValue(stringProp(textStyle, 'fontSize', ''), defaultFontSizePx),
    lineHeight: stringProp(textStyle, 'lineHeight', '1.6'),
    textAlign: stringProp(textStyle, 'textAlign', ''),
  };
}

function buttonTextStyleProps(props: Record<string, unknown>): { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string } {
  const textStyle = isRecord(props.buttonTextStyle) ? props.buttonTextStyle : props;
  return {
    fontFamily: stringProp(textStyle, 'fontFamily', ''),
    color: stringProp(textStyle, 'color', ''),
    fontSize: fontSizeFieldValue(stringProp(textStyle, 'fontSize', ''), defaultFontSizePx),
    lineHeight: stringProp(textStyle, 'lineHeight', ''),
    textAlign: stringProp(textStyle, 'textAlign', ''),
  };
}

function buttonSpacingProps(props: Record<string, unknown>): { margin: string; padding: string } {
  const spacing = isRecord(props.buttonSpacing) ? props.buttonSpacing : props;
  return {
    margin: stringProp(spacing, 'margin', ''),
    padding: stringProp(spacing, 'padding', ''),
  };
}

function blockSpacingProps(props: Record<string, unknown>): { margin: string; padding: string; interline: string } {
  const spacing = isRecord(props.spacing) ? props.spacing : props;
  return {
    margin: stringProp(spacing, 'margin', '0'),
    padding: stringProp(spacing, 'padding', '0'),
    interline: stringProp(spacing, 'interline', '1.6'),
  };
}

function splitMediaTextStyleProps(props: Record<string, unknown>): { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string } {
  const textStyle = isRecord(props.textStyle) ? props.textStyle : {};
  return {
    fontFamily: stringProp(textStyle, 'fontFamily', ''),
    color: stringProp(textStyle, 'color', ''),
    fontSize: fontSizeFieldValue(stringProp(textStyle, 'fontSize', ''), defaultFontSizePx),
    lineHeight: stringProp(textStyle, 'lineHeight', '1.6'),
    textAlign: stringProp(textStyle, 'textAlign', ''),
  };
}

function splitMediaTextSpacingProps(props: Record<string, unknown>): { margin: string; padding: string; interline: string } {
  const spacing = isRecord(props.textSpacing) ? props.textSpacing : {};
  return {
    margin: stringProp(spacing, 'margin', '0'),
    padding: stringProp(spacing, 'padding', '0'),
    interline: stringProp(spacing, 'interline', '1.6'),
  };
}

function splitMediaMediaSpacingProps(props: Record<string, unknown>): { margin: string; padding: string } {
  const spacing = isRecord(props.mediaSpacing) ? props.mediaSpacing : {};
  return {
    margin: stringProp(spacing, 'margin', '0'),
    padding: stringProp(spacing, 'padding', '0'),
  };
}

function updateBlockTextStyle(props: Record<string, unknown>, patch: Partial<{ fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }>) {
  return {
    ...props,
    textStyle: {
      ...(isRecord(props.textStyle) ? props.textStyle : {}),
      ...patch,
    },
  };
}

function updateTitleTextStyle(props: Record<string, unknown>, patch: Partial<{ fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }>) {
  return {
    ...props,
    titleTextStyle: {
      ...(isRecord(props.titleTextStyle) ? props.titleTextStyle : {}),
      ...patch,
    },
  };
}

function updateButtonTextStyle(props: Record<string, unknown>, patch: Partial<{ fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }>) {
  return {
    ...props,
    buttonTextStyle: {
      ...(isRecord(props.buttonTextStyle) ? props.buttonTextStyle : {}),
      ...patch,
    },
  };
}

function updateButtonSpacing(props: Record<string, unknown>, patch: Partial<{ margin: string; padding: string }>) {
  return {
    ...props,
    buttonSpacing: {
      ...(isRecord(props.buttonSpacing) ? props.buttonSpacing : {}),
      ...patch,
    },
  };
}

function updateBlockSpacing(props: Record<string, unknown>, patch: Partial<{ margin: string; padding: string }>) {
  return {
    ...props,
    spacing: {
      ...(isRecord(props.spacing) ? props.spacing : {}),
      ...patch,
    },
  };
}

function updateSplitMediaTextStyle(props: Record<string, unknown>, patch: Partial<{ fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }>) {
  return {
    ...props,
    textStyle: {
      ...(isRecord(props.textStyle) ? props.textStyle : {}),
      ...patch,
    },
  };
}

function updateSplitMediaTextSpacing(props: Record<string, unknown>, patch: Partial<{ margin: string; padding: string; interline: string }>) {
  return {
    ...props,
    textSpacing: {
      ...(isRecord(props.textSpacing) ? props.textSpacing : {}),
      ...patch,
    },
  };
}

function updateSplitMediaMediaSpacing(props: Record<string, unknown>, patch: Partial<{ margin: string; padding: string }>) {
  return {
    ...props,
    mediaSpacing: {
      ...(isRecord(props.mediaSpacing) ? props.mediaSpacing : {}),
      ...patch,
    },
  };
}

function normalizeColor(value: string): string | null {
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : null;
}

function createDefaultBlock(label: string): EditorBlock {
  return createDefaultBlockForType('hero', label);
}

function createDefaultBlockForType(type: PageBlockType, label: string): EditorBlock {
  const definition = getPageBlockDefinition(type);
  return {
    id: crypto.randomUUID(),
    type,
    variant: definition?.defaultVariant ?? 'default',
    props: cloneJsonValue(definition ? definition.createDefaultProps(label) : createDefaultPageBlockProps(type, label)),
  };
}

function normalizeSeo(seo: unknown): { title?: string; description?: string } {
  return isRecord(seo) ? { title: typeof seo.title === 'string' ? seo.title : undefined, description: typeof seo.description === 'string' ? seo.description : undefined } : {};
}

function normalizeProps(props: unknown): Record<string, unknown> {
  return isRecord(props) ? cloneJsonValue(props) : {};
}

function stringProp(props: Record<string, unknown>, key: string, fallback: string): string {
  return typeof props[key] === 'string' && props[key].trim().length > 0 ? (props[key] as string) : fallback;
}

function booleanProp(props: Record<string, unknown>, key: string): boolean {
  return typeof props[key] === 'boolean' ? (props[key] as boolean) : false;
}

function numberProp(props: Record<string, unknown>, key: string, fallback: number): number {
  return typeof props[key] === 'number' && Number.isFinite(props[key]) ? (props[key] as number) : fallback;
}

function clampNumber(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function cloneJsonValue<T>(value: T): T {
  if (value === null || value === undefined) return value;
  return typeof structuredClone === 'function' ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function overlayItemsProp(props: Record<string, unknown>): Array<{ id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; position: string; framed: boolean; textStyle: { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }; spacing: { margin: string; padding: string; interline: string } }> {
  const value = props.overlays;
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const record = isRecord(item) ? item : null;
      if (!record) return null;
      const tag = record.tag === 'h1' || record.tag === 'h2' || record.tag === 'h3' || record.tag === 'p' ? record.tag : 'h2';
      return {
        id: typeof record.id === 'string' && record.id.trim().length > 0 ? record.id : `overlay-${index}`,
        tag,
        text: typeof record.text === 'string' ? record.text : '',
        position: typeof record.position === 'string' && record.position.trim().length > 0 ? record.position : 'bottom-left',
        framed: typeof record.framed === 'boolean' ? record.framed : false,
        textStyle: blockTextStyleProps(record),
        spacing: blockSpacingProps(record),
      };
    })
    .filter((item): item is { id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; position: string; framed: boolean; textStyle: { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }; spacing: { margin: string; padding: string; interline: string } } => item !== null);
}

function createDefaultOverlayItem() {
  return {
    id: crypto.randomUUID(),
    tag: 'h2' as const,
    text: 'Overlay text',
    position: 'bottom-left',
    framed: false,
    textStyle: { fontFamily: '', color: '', fontSize: String(defaultFontSizePx), lineHeight: '1.6', textAlign: '' },
    spacing: { margin: '', padding: '', interline: '' },
  };
}

function updateOverlayItems(
  props: Record<string, unknown>,
  overlayIndex: number,
  patch: Partial<{ id: string; tag: 'h1' | 'h2' | 'h3' | 'p'; text: string; position: string; framed: boolean; textStyle: { fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }; spacing: { margin: string; padding: string; interline: string } }>,
) {
  return overlayItemsProp(props).map((overlay, currentIndex) => (currentIndex === overlayIndex ? { ...overlay, ...patch } : overlay));
}

function updateOverlayTextStyle(props: Record<string, unknown>, overlayIndex: number, patch: Partial<{ fontFamily: string; color: string; fontSize: string; lineHeight: string; textAlign: string }>) {
  return updateOverlayItems(props, overlayIndex, {
    textStyle: {
      ...(overlayItemsProp(props)[overlayIndex]?.textStyle ?? { fontFamily: '', color: '', fontSize: String(defaultFontSizePx), lineHeight: '1.6', textAlign: '' }),
      ...patch,
    },
  });
}

function updateOverlaySpacing(props: Record<string, unknown>, overlayIndex: number, patch: Partial<{ margin: string; padding: string; interline: string }>) {
  return updateOverlayItems(props, overlayIndex, {
    spacing: {
      ...(overlayItemsProp(props)[overlayIndex]?.spacing ?? { margin: '', padding: '', interline: '' }),
      ...patch,
    },
  });
}

function fontSizeFieldValue(value: string, fallback: number): string {
  const trimmed = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return trimmed;
  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pxMatch) return pxMatch[1] ?? String(fallback);
  const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)rem$/i);
  if (remMatch) return String(Math.round(Number(remMatch[1]) * 16));
  const emMatch = trimmed.match(/^(\d+(?:\.\d+)?)em$/i);
  if (emMatch) return String(Math.round(Number(emMatch[1]) * fallback));
  return String(fallback);
}

type CarouselSlideFormValue = { eyebrow: string; title: string; body: string; imageUrl: string; ctaLabel: string; ctaHref: string };

function carouselSlidesProp(props: Record<string, unknown>, preset: string): CarouselSlideFormValue[] {
  const value = props.slides;
  if (!Array.isArray(value) || value.length === 0) {
    return getCarouselPresetSlides(preset).map((slide, index) => ({
      eyebrow: slide.eyebrow ?? '',
      title: slide.title || `Slide ${index + 1}`,
      body: slide.body ?? '',
      imageUrl: slide.imageUrl ?? '',
      ctaLabel: slide.ctaLabel ?? '',
      ctaHref: slide.ctaHref ?? '',
    }));
  }
  return value
    .map((item, index) => {
      const record = isRecord(item) ? item : null;
      if (!record) return null;
      return {
        eyebrow: typeof record.eyebrow === 'string' ? record.eyebrow : '',
        title: typeof record.title === 'string' && record.title.trim().length > 0 ? record.title : `Slide ${index + 1}`,
        body: typeof record.body === 'string' ? record.body : '',
        imageUrl: typeof record.imageUrl === 'string' ? record.imageUrl : '',
        ctaLabel: typeof record.ctaLabel === 'string' ? record.ctaLabel : '',
        ctaHref: typeof record.ctaHref === 'string' ? record.ctaHref : '',
      };
    })
    .filter((slide): slide is CarouselSlideFormValue => slide !== null);
}

function createCarouselSlide(preset: string, index: number): CarouselSlideFormValue {
  const defaults = getCarouselPresetSlides(preset);
  const sample = defaults[index % Math.max(defaults.length, 1)] ?? defaults[0] ?? { eyebrow: '', title: `Slide ${index + 1}`, body: '', imageUrl: '', ctaLabel: '', ctaHref: '' };
  return { eyebrow: sample.eyebrow ?? '', title: `Slide ${index + 1}`, body: sample.body ?? '', imageUrl: sample.imageUrl ?? '', ctaLabel: sample.ctaLabel ?? '', ctaHref: sample.ctaHref ?? '' };
}

function updateCarouselSlides(slides: CarouselSlideFormValue[], slideIndex: number, patch: Partial<CarouselSlideFormValue>) {
  return slides.map((slide, currentIndex) => (currentIndex === slideIndex ? { ...slide, ...patch } : slide));
}

function reorderCarouselSlides(slides: CarouselSlideFormValue[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return slides;
  if (fromIndex < 0 || fromIndex >= slides.length || toIndex < 0 || toIndex >= slides.length) return slides;
  const next = [...slides];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return slides;
  next.splice(toIndex, 0, item);
  return next;
}

function moveCarouselSlide(slides: CarouselSlideFormValue[], slideIndex: number, direction: -1 | 1) {
  const target = slideIndex + direction;
  if (target < 0 || target >= slides.length) return slides;
  return reorderCarouselSlides(slides, slideIndex, target);
}
