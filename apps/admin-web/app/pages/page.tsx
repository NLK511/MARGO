import Link from 'next/link';
import { ShellCard } from '@margo/ui';

const demoPages = [
  { id: 'home', title: 'Homepage', slug: 'home', status: 'published', seoTitle: 'Seasonal neighborhood dining' },
  { id: 'about', title: 'About', slug: 'about', status: 'draft', seoTitle: 'About our business' },
];

export default function AdminPagesList() {
  return (
    <main className="page-shell admin-page-shell">
      <section className="admin-stack">
        <ShellCard eyebrow="Frontpage" title="Pages">
          <p>Create, edit, and publish tenant public pages. Booking and CRM navigation stay module-aware on the public surface.</p>
          <Link className="admin-action" href="/pages/new">
            New page
          </Link>
        </ShellCard>

        <div className="admin-table" role="table" aria-label="Tenant pages">
          <div className="admin-table-row admin-table-head" role="row">
            <span>Title</span>
            <span>Slug</span>
            <span>Status</span>
            <span>SEO title</span>
            <span>Action</span>
          </div>
          {demoPages.map((page) => (
            <div key={page.id} className="admin-table-row" role="row">
              <span>{page.title}</span>
              <span>/{page.slug}</span>
              <span className={`status-pill status-${page.status}`}>{page.status}</span>
              <span>{page.seoTitle}</span>
              <Link href={`/pages/${page.id}`}>Edit</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
