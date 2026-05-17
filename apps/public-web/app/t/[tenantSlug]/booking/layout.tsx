import type { ReactNode } from 'react';
import { TenantBrandShell } from '../../../tenant-brand-shell';
import { getDemoTenantBranding, resolvePublicTenantBranding } from '../../../tenant-branding';

type TenantBookingLayoutProps = {
  params: Promise<{ tenantSlug: string }>;
  children: ReactNode;
};

export default async function TenantBookingLayout({ params, children }: TenantBookingLayoutProps) {
  const { tenantSlug } = await params;

  try {
    const branding = await resolvePublicTenantBranding(tenantSlug);
    return (
      <TenantBrandShell branding={branding} homeHref={`/t/${tenantSlug}`}>
        {children}
      </TenantBrandShell>
    );
  } catch {
    const branding = getDemoTenantBranding('maison-noire');
    return (
      <TenantBrandShell branding={branding} homeHref={`/t/${tenantSlug}`} note="Using demo booking branding because live tenant data is unavailable.">
        {children}
      </TenantBrandShell>
    );
  }
}
