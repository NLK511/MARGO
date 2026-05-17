import { notFound } from 'next/navigation';
import { TenantBrandShell } from '../../../tenant-brand-shell';
import { QuoteRequestConfirmation } from '../../../quote-request/quote-request-confirmation';
import { getQuoteRequestConfirmationForCurrentRequest } from '../../../quote-request/quote-request-data';

type QuoteRequestConfirmationProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicQuoteRequestConfirmationPage({ params }: QuoteRequestConfirmationProps) {
  const { token } = await params;
  const model = await getQuoteRequestConfirmationForCurrentRequest(token);
  if (!model) notFound();

  return (
    <TenantBrandShell branding={model.tenant} homeHref={`/t/${model.tenant.slug}`} note={`Tenant-scoped confirmation for /t/${model.tenant.slug}/quote-request.`}>
      <QuoteRequestConfirmation request={model.request} />
    </TenantBrandShell>
  );
}
