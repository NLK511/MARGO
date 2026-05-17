import React, { type CSSProperties, type ReactNode } from 'react';
import type { TenantBrandingSnapshot } from './tenant-branding';
import { buildTenantRuntimeSurface } from './tenant-branding';

export function TenantBrandShell({ branding, homeHref, children, note }: { branding: TenantBrandingSnapshot; homeHref?: string; children: ReactNode; note?: string }) {
  const runtimeSurface = buildTenantRuntimeSurface(branding);
  const safeHomeHref = typeof homeHref === 'string' && homeHref.trim().length > 0 && homeHref.trim() !== '/' ? homeHref : `/t/${branding.slug}`;

  return (
    <main
      className={`frontpage tenant-shell ${runtimeSurface.className}`}
      data-tenant-theme={branding.slug}
      data-layout-preset={runtimeSurface.dataAttributes['data-layout-template']}
      data-content-width={runtimeSurface.dataAttributes['data-content-width']}
      style={{
        ...runtimeSurface.style,
        fontFamily: 'var(--font-body, var(--font-sans))',
      } as CSSProperties}
    >
      <header className="tenant-brand-banner" aria-label="Tenant branding">
        <a className="brand" href={safeHomeHref}>
          {branding.logoUrl ? <img className="brand-mark" src={branding.logoUrl} alt="" aria-hidden="true" /> : <span className="brand-mark brand-mark-placeholder">{branding.displayName.slice(0, 1)}</span>}
          <span className="brand-copy">
            <span className="brand-logotype">{branding.displayName}</span>
            <span className="brand-subtitle">{branding.slug}</span>
          </span>
        </a>
        {note ? <p className="tenant-brand-note">{note}</p> : null}
      </header>
      {children}
    </main>
  );
}
