import React from 'react';
import { TenantBrandShell } from '../tenant-brand-shell';
import { QuoteRequestWizard } from './quote-request-wizard';
import { getQuoteRequestPageForCurrentRequest } from './quote-request-data';

import { notFound } from 'next/navigation';

export default async function PublicQuoteRequestPage() {
  const model = await getQuoteRequestPageForCurrentRequest();
  if (!model) notFound();

  return (
    <TenantBrandShell branding={model.tenant} note={`Tenant-scoped links use /t/${model.tenant.slug}/quote-request.`}>
      <QuoteRequestWizard tenantSlug={model.tenant.slug} config={model.config} confirmationBasePath={`/t/${model.tenant.slug}/quote-request/confirmation`} />
    </TenantBrandShell>
  );
}
