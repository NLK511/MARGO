import { cookies } from 'next/headers';
import { ShellCard } from '@margo/ui';
import { DEFAULT_DEV_SESSION, getModuleSettings, parseDevSessionCookie } from './admin-context';
import { ThemePresetSwitcher } from './theme-preset-switcher';

export default async function AdminHomePage() {
  const cookieStore = await cookies();
  const session = parseDevSessionCookie(cookieStore.get('margo_dev_session')?.value) ?? DEFAULT_DEV_SESSION;
  const modules = getModuleSettings(session);

  return (
    <main className="page-shell">
      <section className="admin-grid">
        <ShellCard eyebrow="Admin web" title="Branding preview">
          <p>Tenant admins can choose a theme preset and preview runtime tokens persisted to tenant branding.</p>
          <p className="form-help">Signed in tenant: {session.tenantName}</p>
        </ShellCard>

        <ThemePresetSwitcher initialPresetId="clinical-calm" tenantName={session.tenantName} />

        <ShellCard eyebrow="Operations" title="Tenant modules">
          <p className="form-help">Read-only MVP settings. Disabled module routes are guarded in the admin app.</p>
          <div className="module-settings-list" aria-label="Tenant module settings">
            {modules.map((module) => (
              <article key={module.id} className="module-settings-row">
                <div>
                  <strong>{module.name}</strong>
                  <p>{module.description}</p>
                </div>
                <span className={module.enabled ? 'status-pill status-published' : 'status-pill status-draft'}>
                  {module.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </article>
            ))}
          </div>
        </ShellCard>
      </section>
    </main>
  );
}
