import React from 'react';
import { ShellCard } from '@margo/ui';
import { themePresets } from '@margo/themes';
import { SurfaceShell } from '../../surface-shell';

export default function GlobalThemesPage() {
  return (
    <SurfaceShell surface="global-admin">
      <ShellCard eyebrow="Themes" title="White-label theme inventory">
        <p>Global themes are reusable visual presets and do not include tenant logos, photos, or copy.</p>
        <div className="theme-studio-family-list">
          {themePresets.map((preset) => (
            <article key={preset.id} className="theme-studio-family-card">
              <div>
                <p className="section-kicker">Preset</p>
                <h3>{preset.name}</h3>
                <p className="form-help">ID: {preset.id} · Primary: {preset.colors.primary}</p>
              </div>
              <div className="theme-studio-family-actions">
                <a className="button-link" href={`/global-admin/theme-studio?theme=${preset.id}`}>Edit theme</a>
              </div>
            </article>
          ))}
        </div>
      </ShellCard>
    </SurfaceShell>
  );
}
