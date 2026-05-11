import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEFAULT_DEV_SESSION, parseDevSessionCookie } from '../../admin-context';

export async function GET() {
  const cookieStore = await cookies();
  const session = parseDevSessionCookie(cookieStore.get('margo_dev_session')?.value) ?? DEFAULT_DEV_SESSION;
  return NextResponse.json({ userId: session.userId, email: session.email, displayName: session.displayName, roles: session.roles });
}
