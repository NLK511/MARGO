import { notFound } from 'next/navigation';
import { ShellCard } from '@margo/ui';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';

const blockTypes = ['hero', 'service-list', 'location', 'cta', 'rich-text', 'contact-form'];

type PageEditorProps = { params: Promise<{ pageId: string }> };

export default async function AdminPageEditor({ params }: PageEditorProps) {
  const { pageId } = await params;
  const session = await getCurrentDevSession();
  const data = getTenantAdminDemoData(session);
  const page = pageId === 'new' ? null : data.pages.find((item) => item.id === pageId);
  if (pageId !== 'new' && !page) notFound();

  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Frontpage" title={pageId === 'new' ? `Create ${session.tenantName} page` : `Edit ${session.tenantName} page: ${page?.title}`}>
          <p>Minimal MVP editor shell for tenant-scoped page content, SEO metadata, publication state, and block ordering.</p>
        </ShellCard>

        <form className="editor-form" aria-label="Page editor">
          <label>Page title<input name="title" defaultValue={page?.title ?? ''} /></label>
          <label>Slug<input name="slug" defaultValue={page?.slug ?? ''} /></label>
          <label>SEO title<input name="seoTitle" defaultValue={page?.seoTitle ?? ''} /></label>
          <label>SEO description<textarea name="seoDescription" defaultValue={page?.seoDescription ?? ''} /></label>
          <label>Publication status<select name="status" defaultValue={page?.status ?? 'draft'}><option value="draft">Draft</option><option value="published">Published</option></select></label>

          <fieldset>
            <legend>MVP blocks</legend>
            <div className="block-chip-list">
              {blockTypes.map((blockType) => <span key={blockType} className="block-chip">{blockType}</span>)}
            </div>
          </fieldset>

          <div className="editor-actions">
            <button type="button">Save draft</button>
            <button type="button" className="primary-admin-button">Publish page</button>
          </div>
        </form>
      </section>
    </main>
  );
}
