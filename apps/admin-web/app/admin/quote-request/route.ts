import { NextResponse } from 'next/server';
import { createQuoteRequestService, prisma, syncDemoTenantSeedSnapshot, type QuoteRequestModuleConfig } from '@margo/db';
import { getCurrentDevSession } from '../../session';
import { getAdminTenantRecord } from '../../admin-db';

export async function GET() {
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });

  const service = createQuoteRequestService();
  const [config, requests] = await Promise.all([
    service.getConfig({ tenantId: tenant.tenantId }),
    service.listRequests({ tenantId: tenant.tenantId, take: 12 }),
  ]);

  return NextResponse.json({ config, requests });
}

export async function PATCH(request: Request) {
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { config?: unknown; enabled?: boolean } | null;
  if (!body || typeof body.config !== 'object' || Array.isArray(body.config)) {
    return NextResponse.json({ message: 'Quote request config is required.' }, { status: 400 });
  }

  const service = createQuoteRequestService();
  await service.saveConfig({ tenantId: tenant.tenantId, config: body.config as QuoteRequestModuleConfig, enabled: body.enabled });
  const config = await service.getConfig({ tenantId: tenant.tenantId });
  await syncDemoTenantSeedSnapshot(prisma, tenant.tenantId).catch((error) => {
    console.warn('Failed to persist demo tenant snapshot after quote-request update.', error);
  });
  return NextResponse.json({ ok: true, config });
}
