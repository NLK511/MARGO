import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { getCurrentDevSession } from '../../session';

export async function POST(request: Request) {
  const session = await getCurrentDevSession();
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ message: 'Multipart form data is required.' }, { status: 400 });

  const file = formData.get('file');
  const kind = normalizeSegment(formData.get('kind')) ?? 'asset';
  if (!(file instanceof File)) return NextResponse.json({ message: 'Media file is required.' }, { status: 400 });
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) return NextResponse.json({ message: 'Only image and video files are supported.' }, { status: 400 });
  const maxSize = isVideo ? 64 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ message: isVideo ? 'Video is too large (max 64MB).' : 'Image is too large (max 8MB).' }, { status: 413 });

  const uploadsRoots = [
    resolve(process.cwd(), 'public/uploads/branding', session.tenantSlug),
    resolve(process.cwd(), '../public-web/public/uploads/branding', session.tenantSlug),
  ];

  const extension = safeExtension(file.name, file.type);
  const filename = `${kind}-${Date.now()}-${randomUUID()}${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await Promise.all(
    uploadsRoots.map(async (uploadsRoot) => {
      await mkdir(uploadsRoot, { recursive: true });
      await writeFile(resolve(uploadsRoot, filename), bytes);
    }),
  );

  return NextResponse.json({ url: `/uploads/branding/${session.tenantSlug}/${filename}`, filename, contentType: file.type });
}

function normalizeSegment(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().replace(/[^a-z0-9-_]/gi, '-') : null;
}

function safeExtension(filename: string, contentType: string): string {
  const ext = extname(filename).toLowerCase();
  if (ext && /^\.[a-z0-9]+$/.test(ext)) return ext;

  switch (contentType) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/svg+xml':
      return '.svg';
    case 'video/mp4':
      return '.mp4';
    case 'video/webm':
      return '.webm';
    case 'video/ogg':
      return '.ogv';
    default:
      return contentType.startsWith('video/') ? '.video' : '.img';
  }
}
