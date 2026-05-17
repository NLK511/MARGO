'use client';

import Link from 'next/link';
import { ShellCard } from '@margo/ui';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-shell admin-page-shell empty-state-page">
      <ShellCard eyebrow="Error" title="Something went wrong">
        <p>We could not render this admin page.</p>
        <p className="form-help">{error.message}</p>
        <div className="page-editor-actions">
          <button type="button" className="primary-admin-button" onClick={reset}>
            Try again
          </button>
          <Link className="admin-action" href="/">
            Return to dashboard
          </Link>
        </div>
      </ShellCard>
    </main>
  );
}
