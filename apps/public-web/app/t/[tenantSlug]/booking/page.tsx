import { notFound } from 'next/navigation';
import { TenantBookingPage } from '../../../booking/tenant-booking';

type TenantBookingRouteProps = { params: Promise<{ tenantSlug: string }> };

export default async function TenantBookingRoute({ params }: TenantBookingRouteProps) {
  const { tenantSlug } = await params;
  if (tenantSlug !== 'table-and-co' && tenantSlug !== 'oak-clinic') notFound();
  return <TenantBookingPage tenantSlug={tenantSlug} />;
}
