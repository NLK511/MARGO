import { notFound } from 'next/navigation';
import { getCurrentDevSession } from '../../../session';
import { getAdminPageRecord, getAdminTenantRecord, type AdminTenantRecord } from '../../../admin-db';
import { PageEditorClient } from './page-editor-client';

type PageEditorProps = { params: Promise<{ pageId: string }> };

export default async function AdminPageEditor({ params }: PageEditorProps) {
  const { pageId } = await params;
  const session = await getCurrentDevSession();
  const tenant: AdminTenantRecord = (await getAdminTenantRecord(session.tenantSlug)) ?? {
    displayName: session.tenantName,
    tenantId: session.tenantId,
    slug: session.tenantSlug,
    enabledModules: session.enabledModules,
    themePresetId: 'clinical-calm',
    layoutConfig: {},
    themeOverrides: {},
    logoUrl: null,
    faviconUrl: null,
  };
  const page = await getAdminPageRecord(session.tenantSlug, pageId);
  if (pageId !== 'new' && !page) notFound();
  return (
    <main className="page-shell admin-page-shell">
      <PageEditorClient tenantSlug={tenant.slug} tenantName={tenant.displayName} pageId={pageId} initialPage={page} />
    </main>
  );
}
