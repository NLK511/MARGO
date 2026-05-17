import { NextResponse } from 'next/server';
import { prisma, syncDemoTenantSeedSnapshot } from '@margo/db';
import { moduleRegistry } from '@margo/modules';
import { getCurrentDevSession } from '../../session';
import { getAdminTenantRecord, getModuleSettingsFromModules } from '../../admin-db';
import { serializeDevSessionCookie } from '../../admin-context';

export async function GET() {
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });
  return NextResponse.json({ modules: getModuleSettingsFromModules(tenant.enabledModules) });
}

export async function PATCH(request: Request) {
  const session = await getCurrentDevSession();
  const tenant = await getAdminTenantRecord(session.tenantSlug);
  if (!tenant) return NextResponse.json({ message: 'Tenant not found.' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { moduleId?: string; enabled?: boolean } | null;
  const moduleId = body?.moduleId?.trim();
  const enabled = body?.enabled;
  if (!moduleId || typeof enabled !== 'boolean') {
    return NextResponse.json({ message: 'Module id and enabled flag are required.' }, { status: 400 });
  }

  if (!moduleRegistry.get(moduleId)) return NextResponse.json({ message: 'Unknown module.' }, { status: 404 });

  const currentEnabledModules = tenant.enabledModules;
  const nextEnabledModules = enabled
    ? Array.from(new Set([...currentEnabledModules, moduleId]))
    : currentEnabledModules.filter((currentModuleId) => currentModuleId !== moduleId);

  const dependencyIssues = moduleRegistry.validateEnabledModules(nextEnabledModules).filter((issue) => issue.moduleId === moduleId && issue.missingDependency !== moduleId);
  const missingDependencies = dependencyIssues.map((issue) => issue.missingDependency).filter((dependency) => moduleRegistry.get(dependency));
  const nextEnabledModulesWithDependencies = enabled ? Array.from(new Set([...nextEnabledModules, ...missingDependencies])) : nextEnabledModules;
  const modulesToUpsert = enabled ? Array.from(new Set([moduleId, ...missingDependencies])) : [moduleId];

  const dependentIssues = moduleRegistry
    .validateEnabledModules(nextEnabledModules)
    .filter((issue) => issue.missingDependency === moduleId && issue.moduleId !== moduleId);
  if (!enabled && dependentIssues.length > 0) {
    return NextResponse.json(
      { message: `Cannot disable ${moduleId} while ${dependentIssues.map((issue) => issue.moduleId).join(', ')} depends on it.` },
      { status: 409 },
    );
  }

  const now = new Date();
  await prisma.$transaction(
    modulesToUpsert.map((currentModuleId) =>
      prisma.tenantModule.upsert({
        where: { tenantId_moduleId: { tenantId: tenant.tenantId, moduleId: currentModuleId } },
        update: { enabled: enabled || currentModuleId !== moduleId ? true : false, enabledAt: now, disabledAt: enabled || currentModuleId !== moduleId ? null : now },
        create: { tenantId: tenant.tenantId, moduleId: currentModuleId, enabled: enabled || currentModuleId !== moduleId ? true : false, enabledAt: now, disabledAt: enabled || currentModuleId !== moduleId ? null : now },
      }),
    ),
  );

  await syncDemoTenantSeedSnapshot(prisma, tenant.tenantId).catch((error) => {
    console.warn('Failed to persist demo tenant snapshot after module update.', error);
  });

  const updatedTenant = await getAdminTenantRecord(session.tenantSlug);
  const enabledModules = updatedTenant?.enabledModules ?? nextEnabledModulesWithDependencies;
  const response = NextResponse.json({ modules: getModuleSettingsFromModules(enabledModules), enabledModules });
  response.cookies.set('margo_dev_session', serializeDevSessionCookie({ tenantSlug: session.tenantSlug, roles: session.roles, enabledModules }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  response.headers.set('x-margo-modules-updated', 'true');
  return response;
}
