import { cookies } from 'next/headers';
import { DEFAULT_DEV_SESSION, parseDevSessionCookie } from './admin-context';

export async function getCurrentDevSession() {
  const cookieStore = await cookies();
  return parseDevSessionCookie(cookieStore.get('margo_dev_session')?.value) ?? DEFAULT_DEV_SESSION;
}
