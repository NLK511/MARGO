import { ShellCard } from '@margo/ui';

export default function HomePage() {
  return (
    <main className="page-shell">
      <ShellCard eyebrow="Public web" title="MARGO tenant storefront">
        <p>
          This app will render tenant-branded frontpages and public booking flows. Milestone 0
          verifies the split public surface is ready for module implementation.
        </p>
      </ShellCard>
    </main>
  );
}
