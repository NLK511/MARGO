import React from 'react';
import { TenantBookingPage } from './tenant-booking';

export default function PublicBookingPage() {
  return <TenantBookingPage tenantSlug="oak-clinic" showTenantContextWarning />;
}
