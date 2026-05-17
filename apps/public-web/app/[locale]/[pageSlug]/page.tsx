import type { Metadata } from 'next';
import { BrandedMissingPage, FrontpageShell } from '../../frontpage';
import { getFrontpageForCurrentRequest } from '../../frontpage-data';

type LocalePageSlugProps = {
  params: Promise<{ locale: string; pageSlug: string }>;
};

export async function generateMetadata({ params }: LocalePageSlugProps): Promise<Metadata> {
  const { locale, pageSlug } = await params;
  return { title: `${locale}/${pageSlug}`, description: 'Tenant public page.' };
}

export default async function LocalePage({ params }: LocalePageSlugProps) {
  const { locale, pageSlug } = await params;

  try {
    const model = await getFrontpageForCurrentRequest(`/${locale}/${pageSlug}`);
    return model ? <FrontpageShell model={model} /> : <BrandedMissingPage tenantName={`${locale}/${pageSlug}`} />;
  } catch {
    return <BrandedMissingPage tenantName={`${locale}/${pageSlug}`} />;
  }
}
