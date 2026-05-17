import { NextResponse } from 'next/server';
import { prisma, syncDemoTenantSeedSnapshot } from '@margo/db';
import { getCurrentDevSession } from '../../../session';
import { getAdminTenantRecord } from '../../../admin-db';

export async function POST(request: Request) {
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as PagePayload | null;
  const payload = normalizePayload(body);
  if (!payload.ok) return NextResponse.json({ message: payload.message }, { status: 400 });

  try {
    const page = await prisma.$transaction(async (transaction) => {
      const created = await transaction.publicPage.create({
        data: {
          tenantId: tenant.tenantId,
          locale: 'en',
          slug: payload.slug,
          title: payload.title,
          seo: { title: payload.seoTitle, description: payload.seoDescription },
          status: payload.status,
          layoutPreset: payload.layoutPreset,
        },
      });

      await transaction.pageBlock.createMany({
        data: payload.blocks.map((block, index) => ({
          tenantId: tenant.tenantId,
          pageId: created.id,
          type: block.type,
          variant: block.variant,
          props: block.props as never,
          position: index,
        })),
      });

      return created;
    });

    await syncDemoTenantSeedSnapshot(prisma, tenant.tenantId).catch((error) => {
      console.warn('Failed to persist demo tenant snapshot after page creation.', error);
    });

    return NextResponse.json({ pageId: page.id, status: page.status });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not create the page.' }, { status: 409 });
  }
}

type PagePayload = {
  title?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: 'draft' | 'published';
  layoutPreset?: string;
  blocks?: Array<{ id?: string; type?: string; variant?: string; props?: unknown }>;
};

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
