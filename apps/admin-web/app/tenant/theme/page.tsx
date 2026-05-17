import { redirect } from 'next/navigation';

export default async function TenantThemePage() {
  redirect('/tenant/builder/style');
}
