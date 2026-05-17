import { notFound } from 'next/navigation';
import { DEMO_TENANTS } from '@margo/core';
import { TenantBookingPage } from '../../../booking/tenant-booking';

type TenantBookingRouteProps = { params: Promise<{ tenantSlug: string }> };

export default async function TenantBookingRoute({ params }: TenantBookingRouteProps) {
  const { tenantSlug } = await params;
  const tenant = DEMO_TENANTS[tenantSlug as keyof typeof DEMO_TENANTS];
  if (!tenant?.booking) notFound();
  return <TenantBookingPage tenantSlug={tenantSlug} />;
}
