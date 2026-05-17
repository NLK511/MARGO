import { ShellCard } from '@margo/ui';
import { listBuiltinTemplateSummaries } from '@margo/core';
import { SurfaceShell } from '../../surface-shell';

export default function GlobalTemplatesPage() {
  const templates = listBuiltinTemplateSummaries();
  return (
    <SurfaceShell surface="global-admin">
      <ShellCard eyebrow="Templates" title="Versioned file-based templates">
        <p>Templates are explicit starter artifacts for new tenant webapps.</p>
        <div className="admin-table" role="table" aria-label="Templates">
          <div className="admin-table-row admin-table-head" role="row"><span>Name</span><span>Version</span><span>Modules</span></div>
          {templates.map((template) => <div key={template.id} className="admin-table-row" role="row"><span>{template.name}</span><span>{template.templateVersion}</span><span>{template.enabledModules.join(', ')}</span></div>)}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
