import { NextResponse } from 'next/server';
import { getCurrentDevSession } from '../../session';

export async function GET() {
  const session = await getCurrentDevSession();
  return NextResponse.json({ tenantId: session.tenantId, slug: session.tenantSlug, displayName: session.tenantName, enabledModules: session.enabledModules });
}
