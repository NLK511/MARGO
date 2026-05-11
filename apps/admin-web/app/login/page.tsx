import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShellCard } from '@margo/ui';
import { DEV_TENANTS, serializeDevSessionCookie, type DevTenantSlug } from '../admin-context';

async function loginAction(formData: FormData) {
  'use server';
  const tenantSlug = String(formData.get('tenantSlug') ?? 'oak-clinic') as DevTenantSlug;
  const next = String(formData.get('next') ?? '/');
  const cookieStore = await cookies();
  cookieStore.set('margo_dev_session', serializeDevSessionCookie({ tenantSlug }), {
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
            <select name="tenantSlug" defaultValue="oak-clinic" aria-describedby="tenant-help">
              {Object.values(DEV_TENANTS).map((tenant) => (
                <option key={tenant.tenantSlug} value={tenant.tenantSlug}>{tenant.tenantName}</option>
              ))}
            </select>
          </label>
          <p id="tenant-help" className="form-help">Choose frontpage-only, restaurant booking, or clinic CRM tenant.</p>
          <button className="primary-admin-button" type="submit">Continue</button>
        </form>
      </ShellCard>
    </main>
  );
}
