import { ShellCard } from '@margo/ui';

const blockTypes = ['hero', 'service-list', 'location', 'cta', 'rich-text', 'contact-form'];

type PageEditorProps = {
  params: Promise<{ pageId: string }>;
};

export default async function AdminPageEditor({ params }: PageEditorProps) {
  const { pageId } = await params;

  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Frontpage" title={pageId === 'new' ? 'Create page' : `Edit page: ${pageId}`}>
          <p>Minimal MVP editor shell for page content, SEO metadata, publication state, and block ordering.</p>
        </ShellCard>

        <form className="editor-form" aria-label="Page editor">
          <label>
            Page title
            <input name="title" defaultValue={pageId === 'new' ? '' : 'Homepage'} />
          </label>
          <label>
            Slug
            <input name="slug" defaultValue={pageId === 'new' ? '' : 'home'} />
          </label>
          <label>
            SEO title
            <input name="seoTitle" defaultValue="Seasonal neighborhood dining" />
          </label>
          <label>
            SEO description
            <textarea name="seoDescription" defaultValue="Warm, seasonal cooking in the heart of the city." />
          </label>
          <label>
            Publication status
            <select name="status" defaultValue="published">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <fieldset>
            <legend>MVP blocks</legend>
            <div className="block-chip-list">
              {blockTypes.map((blockType) => (
                <span key={blockType} className="block-chip">
                  {blockType}
                </span>
              ))}
            </div>
          </fieldset>

          <div className="editor-actions">
            <button type="button">Save draft</button>
            <button type="button" className="primary-admin-button">
              Publish page
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
