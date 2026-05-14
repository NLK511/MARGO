import { NextResponse } from 'next/server';
import { getCurrentDevSession } from '../../session';

export async function GET() {
  const session = await getCurrentDevSession();
  return NextResponse.json({ userId: session.userId, email: session.email, displayName: session.displayName, roles: session.roles });
}
