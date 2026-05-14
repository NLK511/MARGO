import { ShellCard } from '@margo/ui';
import { getCrmLabels } from '@margo/db';
import { getTenantAdminDemoData } from '../../admin-context';
import { getCurrentDevSession } from '../../session';

export default async function CrmCustomFieldsPage() {
  const session = await getCurrentDevSession();
  const labels = getCrmLabels({ profileKind: session.tenantSlug === 'oak-clinic' ? 'patient' : 'customer' });
  const { customFields } = getTenantAdminDemoData(session);
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="CRM settings" title={`${session.tenantName} ${labels.singular.toLowerCase()} custom fields`}>
          <p>Define lightweight fields captured on this tenant's {labels.singular.toLowerCase()} profiles. CSV import remains a post-MVP enhancement.</p>
        </ShellCard>

        <form className="editor-form" aria-label={`Create ${labels.singular.toLowerCase()} custom field`}>
          <label>Field key<input name="key" placeholder="insurance_number" /></label>
          <label>Label<input name="label" placeholder="Insurance number" /></label>
          <label>Type<select name="fieldType" defaultValue="text"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Select</option></select></label>
          <button className="primary-admin-button" type="button">Add field</button>
        </form>

        <div className="admin-table" role="table" aria-label="Custom fields">
          <div className="admin-table-row admin-table-head" role="row"><span>Key</span><span>Label</span><span>Type</span><span>Required</span><span>Status</span></div>
          {customFields.map((field) => (
            <div key={field.key} className="admin-table-row" role="row">
              <span>{field.key}</span><span>{field.label}</span><span>{field.type}</span><span>{field.required}</span><span className="status-pill status-published">Active</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
