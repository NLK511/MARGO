import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShellCard } from '@margo/ui';
import type { Role } from '@margo/core';
import { DEV_TENANTS, serializeDevSessionCookie, type DevTenantSlug } from '../admin-context';

async function loginAction(formData: FormData) {
  'use server';
  const tenantSlug = String(formData.get('tenantSlug') ?? 'maison-noire') as DevTenantSlug;
  const next = String(formData.get('next') ?? '/');
  const role = String(formData.get('role') ?? 'tenant_owner') as Role;
  const cookieStore = await cookies();
  cookieStore.set('margo_dev_session', serializeDevSessionCookie({ tenantSlug, roles: [role] }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  redirect(next.startsWith('/') ? next : '/');
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <main className="page-shell admin-page-shell auth-page">
      <ShellCard eyebrow="Dev auth" title="Sign in to MARGO admin">
        <p className="form-help">MVP dev login uses a signed tenant cookie abstraction so it can be replaced by Auth.js/OIDC later.</p>
        <form className="editor-form" action={loginAction} aria-label="Development admin login">
          <input type="hidden" name="next" value={params?.next ?? '/'} />
          <label>
            Demo tenant
            <select name="tenantSlug" defaultValue="maison-noire" aria-describedby="tenant-help">
              {Object.values(DEV_TENANTS).map((tenant) => (
                <option key={tenant.tenantSlug} value={tenant.tenantSlug}>{tenant.tenantName}</option>
              ))}
            </select>
          </label>
          <label>
            Surface role
            <select name="role" defaultValue="tenant_owner">
              <option value="tenant_owner">Tenant owner</option>
              <option value="tenant_admin">Tenant admin / builder</option>
              <option value="tenant_staff">Tenant staff</option>
              <option value="provider">Provider</option>
              <option value="global_admin">Global admin</option>
            </select>
          </label>
          <p id="tenant-help" className="form-help">Choose frontpage-only, restaurant booking, or clinic CRM tenant. Global admin is reserved for the platform operator.</p>
          <button className="primary-admin-button" type="submit">Continue</button>
        </form>
      </ShellCard>
    </main>
  );
}
