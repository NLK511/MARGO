'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { useState } from 'react';

type Device = 'desktop' | 'tablet' | 'mobile';

const deviceOptions: Array<{ value: Device; label: string; width: string }> = [
  { value: 'desktop', label: 'Desktop', width: '100%' },
  { value: 'tablet', label: 'Tablet', width: '820px' },
  { value: 'mobile', label: 'Mobile', width: '390px' },
];

export function BuilderPreviewDeviceSwitcher({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<Device>('desktop');
  const current = deviceOptions.find((option) => option.value === device) ?? deviceOptions[0];

  return (
    <section className="admin-stack">
      <div className="admin-action-row" role="tablist" aria-label="Preview device switcher">
        {deviceOptions.map((option) => (
          <button key={option.value} type="button" className={option.value === device ? 'button-link' : 'admin-action'} onClick={() => setDevice(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="builder-preview-frame" data-device={device} style={{ width: current?.width ?? '100%', maxWidth: '100%' }}>
        {children}
      </div>
    </section>
  );
}
