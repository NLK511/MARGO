import Link from 'next/link';
import { ShellCard } from '@margo/ui';

export default async function ModuleUnavailablePage({ searchParams }: { searchParams?: Promise<{ module?: string }> }) {
  const params = await searchParams;
  const moduleName = params?.module ?? 'requested';
  return (
    <main className="page-shell admin-page-shell empty-state-page">
      <ShellCard eyebrow="Not available" title="Module route is disabled">
        <p>This tenant does not have the {moduleName} module enabled, so this admin route is inaccessible.</p>
        <Link className="admin-action" href="/">Return to dashboard</Link>
      </ShellCard>
    </main>
  );
}
