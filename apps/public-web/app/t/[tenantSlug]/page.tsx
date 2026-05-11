import type { Metadata } from 'next';
import { BrandedMissingPage, FrontpageShell } from '../../frontpage';
import { getFrontpageForCurrentRequest } from '../../frontpage-data';

export const dynamic = 'force-dynamic';

type TenantPageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  return { title: `${tenantSlug} homepage`, description: 'Tenant public homepage.' };
}

export default async function TenantHomePage({ params }: TenantPageProps) {
  const { tenantSlug } = await params;

  try {
    const model = await getFrontpageForCurrentRequest(`/t/${tenantSlug}`);
    return model ? <FrontpageShell model={model} /> : <BrandedMissingPage tenantName={tenantSlug} />;
  } catch {
    return <BrandedMissingPage tenantName={tenantSlug} />;
  }
}
