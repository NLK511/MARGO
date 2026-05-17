import type { Metadata } from 'next';
import { BrandedMissingPage, FrontpageShell } from '../../frontpage';
import { getFrontpageForCurrentRequest } from '../../frontpage-data';
import { getDemoFrontpageModel } from '../../demo-frontpage';

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
    const demo = getDemoFrontpageModel(tenantSlug);
    return model ? <FrontpageShell model={model} /> : demo ? <FrontpageShell model={demo} /> : <BrandedMissingPage tenantName={tenantSlug} />;
  } catch {
    const demo = getDemoFrontpageModel(tenantSlug);
    return demo ? <FrontpageShell model={demo} /> : <BrandedMissingPage tenantName={tenantSlug} />;
  }
}
