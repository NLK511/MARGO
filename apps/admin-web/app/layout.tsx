import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { isSurfaceAllowed } from './admin-context';
import { getCurrentDevSession } from './session';
import './styles.css';
import { getAdminTenantRecord } from './admin-db';
import { AdminToastProvider } from './admin-toast';

export const metadata: Metadata = {
  title: 'MARGO Admin',
  description: 'Tenant administration surface for MARGO.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentDevSession();
  const tenant = (await getAdminTenantRecord(session.tenantSlug)) ?? { displayName: session.tenantName, enabledModules: session.enabledModules };
  const surfaces = [
    { label: 'Global Studio', href: '/global-admin', surface: 'global-admin' as const },
    { label: 'Tenant Builder', href: '/tenant', surface: 'tenant' as const },
    { label: 'Owner Portal', href: '/owner', surface: 'owner' as const },
  ].filter((item) => isSurfaceAllowed(item.surface, session));

  return (
    <html lang="en">
      <body>
        <AdminToastProvider>
          <div className="admin-shell">
            <header className="admin-shell-header">
              <Link className="admin-brand" href="/" aria-label="MARGO admin home">MARGO</Link>
              <nav className="admin-nav" aria-label="Admin navigation">
                {surfaces.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
              </nav>
              <div className="admin-user-pill" aria-label="Signed in user">{session.roles.join(', ')} · {tenant.displayName}</div>
            </header>
            {children}
          </div>
        </AdminToastProvider>
      </body>
    </html>
  );
}
