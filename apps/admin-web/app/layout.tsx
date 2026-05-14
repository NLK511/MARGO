import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getAdminNavigation } from './admin-context';
import { getCurrentDevSession } from './session';
import './styles.css';

export const metadata: Metadata = {
  title: 'MARGO Admin',
  description: 'Tenant administration surface for MARGO.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentDevSession();
  const navigation = getAdminNavigation(session);

  return (
    <html lang="en">
      <body>
        <div className="admin-shell">
          <header className="admin-shell-header">
            <Link className="admin-brand" href="/" aria-label="MARGO admin home">MARGO</Link>
            <nav className="admin-nav" aria-label="Admin navigation">
              {navigation.map((item) => <Link key={item.path} href={item.path}>{item.label}</Link>)}
              {session.enabledModules.includes('booking') ? <Link href="/booking/services">Services</Link> : null}
              {session.enabledModules.includes('booking') ? <Link href="/booking/resources">Resources</Link> : null}
            </nav>
            <div className="admin-user-pill" aria-label="Signed in user">Dev owner · {session.tenantName}</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
