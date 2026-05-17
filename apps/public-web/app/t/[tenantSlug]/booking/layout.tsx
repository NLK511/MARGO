import type { ReactNode } from 'react';
import { TenantBrandShell } from '../../../tenant-brand-shell';
import { resolvePublicTenantBranding } from '../../../tenant-branding';

type TenantBookingLayoutProps = {
  params: Promise<{ tenantSlug: string }>;
  children: ReactNode;
};

export default async function TenantBookingLayout({ params, children }: TenantBookingLayoutProps) {
  const { tenantSlug } = await params;
  const branding = await resolvePublicTenantBranding(tenantSlug);

  return (
    <TenantBrandShell branding={branding} homeHref={`/t/${tenantSlug}`}>
      {children}
    </TenantBrandShell>
  );
}
