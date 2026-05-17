'use client';

import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="page-shell admin-page-shell empty-state-page">
          <section style={{ width: 'min(100%, 720px)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', padding: '32px', boxShadow: 'var(--shadow-card, 0 18px 60px rgb(15 23 42 / 0.08))' }}>
            <p style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.14em', margin: '0 0 12px', textTransform: 'uppercase' }}>Error</p>
            <h1 style={{ fontFamily: 'var(--font-display, var(--font-sans))', fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 'var(--font-heading-weight, 700)', lineHeight: 1, margin: '0 0 16px' }}>MARGO Admin crashed</h1>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              <p>Something went wrong while loading the admin app.</p>
              <p className="form-help">{error.message}</p>
              <div className="page-editor-actions">
                <button type="button" className="primary-admin-button" onClick={reset}>
                  Try again
                </button>
                <Link className="admin-action" href="/">
                  Return to dashboard
                </Link>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
