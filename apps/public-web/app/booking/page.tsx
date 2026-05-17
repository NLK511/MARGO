import React from 'react';
import { TenantBookingPage } from './tenant-booking';
import { TenantBrandShell } from '../tenant-brand-shell';
import { getDemoTenantBranding } from '../tenant-branding';

export default function PublicBookingPage() {
  const branding = getDemoTenantBranding('maison-noire');
  return (
    <TenantBrandShell branding={branding} homeHref="/t/maison-noire" note="Demo fallback route. Tenant-scoped links use /t/maison-noire/booking.">
      <div className="booking-flow" data-tenant="maison-noire">
        <TenantBookingPage tenantSlug="maison-noire" />
      </div>
    </TenantBrandShell>
  );
}
