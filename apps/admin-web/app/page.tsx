import { redirect } from 'next/navigation';
import { can } from '@margo/core';
import { getCurrentDevSession } from './session';

export default async function AdminIndexPage() {
  const session = await getCurrentDevSession();
  if (can({ roles: session.roles }, 'owner.dashboard.read')) redirect('/owner');
  if (can({ roles: session.roles }, 'tenant.builder.read')) redirect('/tenant');
  if (can({ roles: session.roles }, 'platform.tenants.read')) redirect('/global-admin');
  redirect('/login');
}
