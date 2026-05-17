import { NextResponse } from 'next/server';
import { createPrismaTenantResolverRepository, createQuoteRequestService } from '@margo/db';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    tenantSlug?: string;
    answers?: Record<string, unknown>;
    lead?: { firstName?: string; lastName?: string; displayName?: string; email?: string; phone?: string; company?: string; message?: string };
  } | null;

  const tenantSlug = body?.tenantSlug?.trim();
  const displayName = body?.lead?.displayName?.trim();
  const email = body?.lead?.email?.trim();
  if (!tenantSlug || !displayName || !email) {
    return NextResponse.json({ message: 'Tenant slug, name, and email are required.' }, { status: 400 });
  }

  const tenant = await createPrismaTenantResolverRepository().findBySlug(tenantSlug);
  if (!tenant || !tenant.enabledModules.includes('quote-request')) {
    return NextResponse.json({ message: 'Quote requests are not available for this tenant.' }, { status: 404 });
  }

  const service = createQuoteRequestService();
  const config = await service.getConfig({ tenantId: tenant.tenantId });
  const result = await service.submit({
    tenantId: tenant.tenantId,
    enabledModules: tenant.enabledModules,
    config,
    answers: body?.answers ?? {},
    lead: {
      firstName: body?.lead?.firstName,
      lastName: body?.lead?.lastName,
      displayName,
      email,
      phone: body?.lead?.phone,
      company: body?.lead?.company,
      message: body?.lead?.message,
    },
  });

  return NextResponse.json({
    publicToken: result.quoteRequest.publicToken,
    outputMode: result.quoteRequest.outputMode,
    quoteMinor: result.quoteRequest.quoteMinor,
    currency: result.quoteRequest.currency,
  });
}
