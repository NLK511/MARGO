import { NextResponse } from 'next/server';
import { createAuditLogService } from '@margo/db';
import { isSurfaceAllowed } from '../../../admin-context';
import { getCurrentDevSession } from '../../../session';
import { createThemeStudioFamily, deleteThemeStudioFamily, listThemeStudioFamilies, ThemeStudioError, transitionThemeStudioFamily, updateThemeStudioDraft } from '../theme-studio-store';
import type { ThemeLifecycle } from '@margo/themes';

export async function GET() {
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
  return NextResponse.json({ families: listThemeStudioFamilies() });
}

export async function POST(request: Request) {
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
  const payload = await readThemeStudioPayload(request);
  if (payload.action !== 'create-family') return NextResponse.json({ message: 'Unsupported action.' }, { status: 400 });

  const family = createThemeStudioFamily({ name: payload.name ?? 'New theme family', sourcePresetId: payload.sourcePresetId ?? 'clinical-calm', description: payload.description }, payload.stateOptions);
  await recordThemeStudioAuditLog('theme.family.create', session.userId, { familyId: family.id, sourcePresetId: family.sourcePresetId, lifecycle: family.lifecycle });
  return NextResponse.json({ family });
}

export async function PATCH(request: Request) {
  const session = await getCurrentDevSession();
  if (!isSurfaceAllowed('global-admin', session)) return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
  const payload = await readThemeStudioPayload(request);

  try {
    if (payload.action === 'update-draft') {
      const family = updateThemeStudioDraft({ familyId: payload.familyId ?? '', name: payload.name, description: payload.description, overrides: payload.overrides }, payload.stateOptions);
      await recordThemeStudioAuditLog('theme.family.update', session.userId, { familyId: family.id, lifecycle: family.lifecycle });
      return NextResponse.json({ family });
    }

    if (payload.action === 'transition') {
      const family = transitionThemeStudioFamily({ familyId: payload.familyId ?? '', lifecycle: payload.lifecycle ?? 'draft' }, payload.stateOptions);
      await recordThemeStudioAuditLog(`theme.family.${payload.lifecycle ?? 'draft'}`, session.userId, { familyId: family.id, lifecycle: family.lifecycle });
      return NextResponse.json({ family });
    }

    if (payload.action === 'delete-family') {
      deleteThemeStudioFamily({ familyId: payload.familyId ?? '' }, payload.stateOptions);
      await recordThemeStudioAuditLog('theme.family.delete', session.userId, { familyId: payload.familyId });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ message: 'Unsupported action.' }, { status: 400 });
  } catch (error) {
    if (error instanceof ThemeStudioError) return NextResponse.json({ message: error.message }, { status: error.status });
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Theme update failed.' }, { status: 500 });
  }
}

async function recordThemeStudioAuditLog(action: string, actorUserId: string, metadata: Record<string, unknown>) {
  const auditLog = createAuditLogService();
  await auditLog.record({ tenantId: null, actorUserId: null, action, entityType: 'theme_family', entityId: null, metadata: { ...metadata, actorUserId } });
}

async function readThemeStudioPayload(request: Request): Promise<{
  action?: string;
  name?: string;
  description?: string;
  sourcePresetId?: string;
  familyId?: string;
  lifecycle?: 'draft' | 'qa' | 'published' | 'deprecated' | 'archived';
  overrides?: Record<string, unknown>;
  stateOptions?: { statePath?: string };
}> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const form = await request.formData();
  const overridesRaw = form.get('overrides');
  return {
    action: stringValue(form.get('action')),
    name: stringValue(form.get('name')),
    description: stringValue(form.get('description')),
    sourcePresetId: stringValue(form.get('sourcePresetId')),
    familyId: stringValue(form.get('familyId')),
    lifecycle: parseLifecycleValue(form.get('lifecycle')),
    overrides: parseJsonValue(overridesRaw),
    stateOptions: stringValue(form.get('statePath')) ? { statePath: stringValue(form.get('statePath')) } : undefined,
  };
}

function parseJsonValue(value: FormDataEntryValue | null): Record<string, unknown> | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function stringValue(value: FormDataEntryValue | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseLifecycleValue(value: FormDataEntryValue | null): ThemeLifecycle | undefined {
  const parsed = stringValue(value);
  return parsed === 'draft' || parsed === 'qa' || parsed === 'published' || parsed === 'deprecated' || parsed === 'archived' ? parsed : undefined;
}
