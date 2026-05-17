import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSurfaceNavigation, isSurfaceAllowed, type AdminSurface } from './admin-context';
import { getAdminTenantRecord } from './admin-db';
import { getCurrentDevSession } from './session';

const surfaceLabels: Record<AdminSurface, string> = {
  'global-admin': 'Global Studio',
  tenant: 'Tenant Builder',
  owner: 'Owner Portal',
};

export async function SurfaceShell({ surface, children }: { surface: AdminSurface; children: ReactNode }) {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? { displayName: session.tenantName, enabledModules: session.enabledModules };
  const allowed = isSurfaceAllowed(surface, session);
  const navigation = getSurfaceNavigation(surface, { enabledModules: tenant.enabledModules, roles: session.roles });

  return (
    <main className="page-shell">
      <section className="admin-stack">
        <div className="surface-heading">
          <div>
            <p className="eyebrow">{surfaceLabels[surface]}</p>
            <h1>{allowed ? surfaceLabels[surface] : 'Access restricted'}</h1>
            <p className="form-help">Signed in as {session.displayName} for {tenant.displayName}.</p>
          </div>
          <nav className="surface-tabs" aria-label="Surface navigation">
            {navigation.map((item) => <Link key={item.path} href={item.path}>{item.label}</Link>)}
          </nav>
        </div>
        {allowed ? children : <p className="form-help">Your current role cannot access this surface.</p>}
      </section>
    </main>
  );
}
