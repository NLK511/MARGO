import { ShellCard } from '@margo/ui';
import { themePresets } from '@margo/themes';
import { SurfaceShell } from '../../surface-shell';

export default function GlobalThemesPage() {
  return (
    <SurfaceShell surface="global-admin">
      <ShellCard eyebrow="Themes" title="White-label theme inventory">
        <p>Global themes are reusable visual presets and do not include tenant logos, photos, or copy.</p>
        <div className="admin-table" role="table" aria-label="Themes">
          <div className="admin-table-row admin-table-head" role="row"><span>Name</span><span>ID</span><span>Primary</span></div>
          {themePresets.map((preset) => <div key={preset.id} className="admin-table-row" role="row"><span>{preset.name}</span><span>{preset.id}</span><span>{preset.colors.primary}</span></div>)}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
