import { redirect } from 'next/navigation';

export default async function TenantBuilderHomePage() {
  redirect('/tenant/builder');
}
