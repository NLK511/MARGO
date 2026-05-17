import { notFound } from 'next/navigation';
import { TenantBrandShell } from '../../../tenant-brand-shell';
import { QuoteRequestWizard } from '../../../quote-request/quote-request-wizard';
import { getQuoteRequestPageModel } from '../../../quote-request/quote-request-data';

export const dynamic = 'force-dynamic';

type QuoteRequestPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantQuoteRequestPage({ params }: QuoteRequestPageProps) {
  const { tenantSlug } = await params;
  const model = await getQuoteRequestPageModel(tenantSlug);
  if (!model) notFound();

  return (
    <TenantBrandShell branding={model.tenant} homeHref={`/t/${tenantSlug}`} note={`Tenant-scoped links use /t/${tenantSlug}/quote-request.`}>
      <QuoteRequestWizard tenantSlug={tenantSlug} config={model.config} confirmationBasePath={`/t/${tenantSlug}/quote-request/confirmation`} />
    </TenantBrandShell>
  );
}
