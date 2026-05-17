import type { Metadata } from 'next';
import { BrandedMissingPage, FrontpageShell } from '../frontpage';
import { getFrontpageForCurrentRequest } from '../frontpage-data';

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${locale} homepage`, description: 'Tenant public homepage.' };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;

  try {
    const model = await getFrontpageForCurrentRequest(`/${locale}`);
    return model ? <FrontpageShell model={model} /> : <BrandedMissingPage tenantName={locale} />;
  } catch {
    return <BrandedMissingPage tenantName={locale} />;
  }
}
