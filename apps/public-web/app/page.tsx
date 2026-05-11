import type { CSSProperties } from 'react';
import { compileThemeStyleAttribute, getThemePreset } from '@margo/themes';
import { ShellCard } from '@margo/ui';

const demoTenant = {
  slug: 'table-and-co',
  displayName: 'Table & Co',
  themePresetId: 'editorial-bistro',
};

export default function HomePage() {
  const theme = getThemePreset(demoTenant.themePresetId);

  return (
    <main className="page-shell" data-tenant-theme={demoTenant.slug} style={compileThemeStyleAttribute(theme) as CSSProperties}>
      <ShellCard eyebrow="Public web" title={`${demoTenant.displayName} storefront`}>
        <p>
          This public surface now receives runtime CSS variables from the tenant theme preset. Future frontpage blocks will use the
          same compiled tokens without rebuilding the app.
        </p>
        <p className="theme-note">Active preset: {theme.name}</p>
      </ShellCard>
    </main>
  );
}
