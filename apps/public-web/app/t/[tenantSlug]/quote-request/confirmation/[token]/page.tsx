import { notFound } from 'next/navigation';
import { TenantBrandShell } from '../../../../../tenant-brand-shell';
import { QuoteRequestConfirmation } from '../../../../../quote-request/quote-request-confirmation';
import { getQuoteRequestConfirmationModel } from '../../../../../quote-request/quote-request-data';

type QuoteRequestConfirmationProps = {
  params: Promise<{ tenantSlug: string; token: string }>;
};

export default async function TenantQuoteRequestConfirmationPage({ params }: QuoteRequestConfirmationProps) {
  const { tenantSlug, token } = await params;
  const model = await getQuoteRequestConfirmationModel(tenantSlug, token);
  if (!model) notFound();

  return (
    <TenantBrandShell branding={model.tenant} homeHref={`/t/${tenantSlug}`} note={`Tenant-scoped confirmation for /t/${tenantSlug}/quote-request.`}>
      <QuoteRequestConfirmation request={model.request} />
    </TenantBrandShell>
  );
}
