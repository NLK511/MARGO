import type { Metadata } from 'next';
import { BrandedMissingPage, FrontpageShell } from './frontpage';
import { getFrontpageForCurrentRequest } from './frontpage-data';
import { demoFrontpage } from './demo-frontpage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MARGO Public Frontpage',
  description: 'Tenant public frontpage runtime.',
};

export default async function HomePage() {
  try {
    const model = await getFrontpageForCurrentRequest('/');
    return model ? <FrontpageShell model={model} /> : <FrontpageShell model={demoFrontpage} />;
  } catch {
    return <BrandedMissingPage tenantName="MARGO" />;
  }
}
