'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { compileThemeStyleAttribute, getThemePreset, themePresets } from '@margo/themes';

export function ThemePresetSwitcher({ initialPresetId, tenantName }: { initialPresetId: string; tenantName: string }) {
  const [presetId, setPresetId] = useState(initialPresetId);
  const theme = getThemePreset(presetId);
  const style = useMemo(() => compileThemeStyleAttribute(theme) as CSSProperties, [theme]);

  return (
    <div className="theme-preview-stack">
      <form className="theme-switcher" aria-label="Theme preset switcher">
        <label htmlFor="themePreset">Theme preset</label>
        <select id="themePreset" name="themePreset" value={presetId} onChange={(event) => setPresetId(event.target.value)}>
          {themePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <p className="form-help">Changing this field updates the preview immediately without changing tenant content.</p>
      </form>

      <aside className="theme-preview" data-theme-preview={theme.id} style={style}>
        <p className="preview-eyebrow">{tenantName}</p>
        <h2>{theme.name}</h2>
        <p>Preview card rendered with tenant CSS variables, matching the public runtime branding path.</p>
        <button type="button">Preview primary action</button>
      </aside>
    </div>
  );
}
