import { NextResponse } from 'next/server';
import { prisma, syncDemoTenantSeedSnapshot } from '@margo/db';
import { getCurrentDevSession } from '../../../../session';
import { getAdminTenantRecord } from '../../../../admin-db';

type PagePayload = {
  title?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: 'draft' | 'published';
  layoutPreset?: string;
  blocks?: Array<{ id?: string; type?: string; variant?: string; props?: unknown }>;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as PagePayload | null;
  const payload = normalizePayload(body);
  if (!payload.ok) return NextResponse.json({ message: payload.message }, { status: 400 });

  const existing = await prisma.publicPage.findFirst({ where: { id: pageId, tenantId: tenant.tenantId } });
  if (!existing) return NextResponse.json({ message: 'Page not found.' }, { status: 404 });

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.publicPage.update({
        where: { id: existing.id },
        data: {
          slug: payload.slug,
          title: payload.title,
          seo: { title: payload.seoTitle, description: payload.seoDescription },
          status: payload.status,
          layoutPreset: payload.layoutPreset,
        },
      });

      await transaction.pageBlock.deleteMany({ where: { pageId: existing.id, tenantId: tenant.tenantId } });
      await transaction.pageBlock.createMany({
        data: payload.blocks.map((block, index) => ({
          tenantId: tenant.tenantId,
          pageId: existing.id,
          type: block.type,
          variant: block.variant,
          props: block.props as never,
          position: index,
        })),
      });
    });

    await syncDemoTenantSeedSnapshot(prisma, tenant.tenantId).catch((error) => {
      console.warn('Failed to persist demo tenant snapshot after page update.', error);
    });

    return NextResponse.json({ pageId: existing.id, status: payload.status });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update the page.' }, { status: 409 });
  }
}

function normalizePayload(body: PagePayload | null):
  | { ok: true; title: string; slug: string; seoTitle: string; seoDescription: string; status: 'draft' | 'published'; layoutPreset: string; blocks: Array<{ type: string; variant: string; props: never }> }
  | { ok: false; message: string } {
  if (!body) return { ok: false, message: 'Request body is required.' };
  const title = body.title?.trim();
  const slug = body.slug?.trim();
  if (!title) return { ok: false, message: 'Page title is required.' };
  if (!slug) return { ok: false, message: 'Slug is required.' };

  return {
    ok: true,
    title,
    slug,
    seoTitle: body.seoTitle?.trim() ?? title,
    seoDescription: body.seoDescription?.trim() ?? '',
    status: body.status === 'published' ? 'published' : 'draft',
    layoutPreset: body.layoutPreset?.trim() || 'classic',
    blocks: normalizeBlocks(body.blocks),
  };
}

function normalizeBlocks(blocks?: PagePayload['blocks']): Array<{ type: string; variant: string; props: never; id: string }> {
  return (blocks ?? []).map((block, index) => ({
    type: typeof block?.type === 'string' && block.type.trim() ? block.type.trim() : 'hero',
    variant: typeof block?.variant === 'string' && block.variant.trim() ? block.variant.trim() : 'centered',
    props: normalizeProps(block?.props),
    id: typeof block?.id === 'string' ? block.id : `block-${index}`,
  }));
}

function normalizeProps(props: unknown): never {
  return (props && typeof props === 'object' && !Array.isArray(props) ? props : {}) as never;
}
