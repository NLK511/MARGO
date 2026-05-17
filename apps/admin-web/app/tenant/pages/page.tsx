import { redirect } from 'next/navigation';

export default async function AdminPagesList() {
  redirect('/tenant/builder/content');
}
