import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEFAULT_DEV_SESSION, getModuleSettings, parseDevSessionCookie } from '../../admin-context';

export async function GET() {
  const cookieStore = await cookies();
  const session = parseDevSessionCookie(cookieStore.get('margo_dev_session')?.value) ?? DEFAULT_DEV_SESSION;
  return NextResponse.json({ modules: getModuleSettings(session) });
}
