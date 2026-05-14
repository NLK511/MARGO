import { NextResponse } from 'next/server';
import { getModuleSettings } from '../../admin-context';
import { getCurrentDevSession } from '../../session';

export async function GET() {
  const session = await getCurrentDevSession();
  return NextResponse.json({ modules: getModuleSettings(session) });
}
