'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdminToast } from './admin-toast';

export interface ModuleSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
}

export function ModuleSettingsEditor({ modules }: { tenantId: string; tenantSlug: string; modules: ModuleSetting[] }) {
  const router = useRouter();
  const { pushToast } = useAdminToast();
  const [items, setItems] = useState(modules);
  const [message, setMessage] = useState('Toggle a module to persist it for this tenant.');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleModule(moduleId: string, enabled: boolean) {
    setBusyId(moduleId);
    setItems((current) => current.map((item) => (item.id === moduleId ? { ...item, enabled } : item)));
    setMessage('Saving module settings...');
    const response = await fetch('/admin/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, enabled }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      const errorMessage = body?.message ?? 'Module toggle failed.';
      setItems((current) => current.map((item) => (item.id === moduleId ? { ...item, enabled: !enabled } : item)));
      setMessage(errorMessage);
      pushToast({ tone: 'error', title: 'Module not updated', message: errorMessage });
      setBusyId(null);
      return;
    }

    const payload = (await response.json()) as { modules?: ModuleSetting[]; enabledModules?: string[] };
    if (Array.isArray(payload.modules)) {
      setItems(payload.modules);
    } else if (Array.isArray(payload.enabledModules)) {
      setItems((current) =>
        current.map((item) => ({
          ...item,
          enabled: payload.enabledModules?.includes(item.id) ?? item.enabled,
        })),
      );
    } else {
      setItems((current) => current.map((item) => (item.id === moduleId ? { ...item, enabled } : item)));
    }

    setMessage('Module settings saved.');
    pushToast({ tone: 'success', title: 'Module updated', message: enabled ? `Enabled ${moduleId}` : `Disabled ${moduleId}` });
    setBusyId(null);
    router.refresh();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('margo:modules-updated', { detail: { enabledModules: payload.enabledModules } }));
    }
  }

  return (
    <div>
      <div className="module-settings-list" aria-label="Tenant module settings">
        {items.map((module) => (
          <article key={module.id} className="module-settings-row">
            <div>
              <strong>{module.name}</strong>
              <p>{module.description}</p>
              {!!module.dependencies.length && <p className="form-help">Depends on: {module.dependencies.join(', ')}</p>}
            </div>
            <button
              type="button"
              className={module.enabled ? 'status-pill status-published' : 'status-pill status-draft'}
              onClick={() => toggleModule(module.id, !module.enabled)}
              disabled={busyId === module.id}
            >
              {busyId === module.id ? 'Saving…' : module.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </article>
        ))}
      </div>
      <p className="form-help">{message}</p>
    </div>
  );
}
