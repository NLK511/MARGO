import type { ReactNode } from 'react';

export function ShellCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        width: 'min(100%, 720px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        padding: '32px',
        boxShadow: '0 18px 60px rgb(15 23 42 / 0.08)',
      }}
    >
      <p
        style={{
          color: 'var(--color-primary)',
          fontSize: '0.8rem',
          fontWeight: 800,
          letterSpacing: '0.14em',
          margin: '0 0 12px',
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </p>
      <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1, margin: '0 0 16px' }}>{title}</h1>
      <div style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>{children}</div>
    </section>
  );
}
