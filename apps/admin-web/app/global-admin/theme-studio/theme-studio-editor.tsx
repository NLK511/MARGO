'use client';

import React, { useMemo, useState } from 'react';
import { compileThemeCssVariables, type ThemePreset } from '@margo/themes';
import { type ThemeStudioFamilyView } from './theme-studio-store';
import { collectThemeColorIssues, buildThemeColorSuggestions, type ThemeColorIssue, type ThemeColorSuggestion } from './theme-studio-color-suggestions';
import {
  assetFields,
  buildThemeFontOptions,
  colorFields,
  layoutFields,
  normalizeColor,
  spacingFields,
  stringThemeValue,
  typographyColorFields,
  typographyFields,
} from './theme-studio-schema';

interface ThemeStudioEditorProps {
  family: ThemeStudioFamilyView;
  themeFontOptions?: string[];
  saveAction: (formData: FormData) => void | Promise<void>;
}

type ThemeEditorState = {
  name: string;
  description: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  typographyColors: Record<string, string>;
  layout: Record<string, string>;
  spacing: Record<string, string>;
  assets: Record<string, string>;
};

export function ThemeStudioEditor({ family, themeFontOptions = buildThemeFontOptions(), saveAction }: ThemeStudioEditorProps) {
  const [state, setState] = useState<ThemeEditorState>(() => buildEditorState(family));
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Record<string, true>>({});

  const previewTheme = useMemo(() => buildPreviewTheme(family.theme, state, family.name), [family, state]);
  const previewVars = useMemo(() => compileThemeCssVariables(previewTheme), [previewTheme]);
  const previewStyle = useMemo(() => Object.fromEntries(Object.entries(previewVars)) as React.CSSProperties, [previewVars]);
  const helperColors = useMemo(() => collectHelperColors(previewTheme), [previewTheme]);
  const colorIssuesByField = useMemo(() => groupColorIssues(collectThemeColorIssues(previewTheme)), [previewTheme]);
  const headingFamily = previewTheme.typography.fontH1 ?? previewTheme.typography.fontDisplay ?? previewTheme.typography.fontSans;
  const bodyFamily = previewTheme.typography.fontBody ?? previewTheme.typography.fontSans;
  const bodyPadding = state.spacing.pagePadding || state.spacing.cardPadding || '24px';
  const blockGap = state.spacing.blockGap || '16px';
  const headingColor = previewTheme.typography.fontH1Color ?? previewTheme.typography.fontDisplayColor ?? previewTheme.colors.text;
  const bodyColor = previewTheme.typography.fontBodyColor ?? previewTheme.colors.textMuted;
  const paragraphColor = previewTheme.typography.fontParagraphColor ?? previewTheme.typography.fontBodyColor ?? previewTheme.colors.textMuted;
  const buttonColor = previewTheme.colors.primaryContrast;
  const buttonBackground = previewTheme.colors.primary;

  return (
    <div className="theme-studio-editor-layout">
      <form action={saveAction} className="editor-form theme-studio-editor-form">
        <input type="hidden" name="familyId" value={family.id} />

        <div className="theme-studio-editor-header">
          <div>
            <p className="section-kicker">{family.isBuiltIn ? 'Built-in theme' : 'Custom theme'}</p>
            <h3>{family.name}</h3>
            <p className="form-help">Saved locally as overrides. Source preset: {family.sourcePresetId} · Lifecycle: {family.lifecycle}</p>
          </div>
          <div className="theme-studio-status-pill-group">
            <span className={`status-pill ${family.canPublish ? 'status-ready' : 'status-warning'}`}>{family.canPublish ? 'Publish ready' : 'Blocked'}</span>
            <span className="status-pill">{family.isBuiltIn ? 'Built-in editable' : 'Draft workspace'}</span>
          </div>
        </div>

        <label>
          Theme name
          <input name="name" value={state.name} onChange={(event) => setState((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label>
          Description
          <textarea name="description" value={state.description} onChange={(event) => setState((current) => ({ ...current, description: event.target.value }))} />
        </label>

        <fieldset className="theme-studio-section">
          <legend>Color palette</legend>
          <p className="form-help">Use the picker and swatches to keep the palette readable while you tune contrast.</p>
          <div className="theme-studio-color-grid">
            {colorFields.map(([key, label]) => {
              const issue = colorIssuesByField[key]?.[0];
              const suggestions = buildColorSuggestionsForField({
                fieldKey: key,
                currentValue: stringThemeValue(state.colors[key]),
                fallbackValue: family.theme.colors[key],
                issue,
                helperColors,
              }).filter((suggestion) => !dismissedSuggestionIds[suggestion.id]);
              return (
                <ColorField
                  key={key}
                  label={label}
                  name={`colors.${key}`}
                  value={stringThemeValue(state.colors[key])}
                  helpers={helperColors}
                  issue={issue}
                  suggestions={suggestions}
                  onChange={(value) => setState((current) => ({ ...current, colors: { ...current.colors, [key]: value } }))}
                  onAcceptSuggestion={(value) => setState((current) => ({ ...current, colors: { ...current.colors, [key]: value } }))}
                  onDismissSuggestion={(id) => setDismissedSuggestionIds((current) => ({ ...current, [id]: true }))}
                />
              );
            })}
          </div>
        </fieldset>

        <fieldset className="theme-studio-section">
          <legend>Typography</legend>
          <div className="theme-studio-typography-grid">
            {typographyFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  name={`typography.${key}`}
                  value={stringThemeValue(state.typography[key])}
                  list="theme-fonts"
                  onChange={(event) => setState((current) => ({ ...current, typography: { ...current.typography, [key]: event.target.value } }))}
                />
              </label>
            ))}
            {typographyColorFields.map(([key, label]) => {
              const issue = colorIssuesByField[key]?.[0];
              const suggestions = buildColorSuggestionsForField({
                fieldKey: key,
                currentValue: stringThemeValue(state.typographyColors[key]),
                fallbackValue: family.theme.typography[key] ? String(family.theme.typography[key]) : family.theme.colors.text,
                issue,
                helperColors,
              }).filter((suggestion) => !dismissedSuggestionIds[suggestion.id]);
              return (
                <ColorField
                  key={key}
                  label={label}
                  name={`typography.${key}`}
                  value={stringThemeValue(state.typographyColors[key])}
                  helpers={helperColors}
                  issue={issue}
                  suggestions={suggestions}
                  onChange={(value) => setState((current) => ({ ...current, typographyColors: { ...current.typographyColors, [key]: value } }))}
                  onAcceptSuggestion={(value) => setState((current) => ({ ...current, typographyColors: { ...current.typographyColors, [key]: value } }))}
                  onDismissSuggestion={(id) => setDismissedSuggestionIds((current) => ({ ...current, [id]: true }))}
                />
              );
            })}
            <label>
              Heading weight
              <input
                name="typography.headingWeight"
                type="number"
                min={100}
                max={900}
                step={100}
                value={state.typography.headingWeight}
                onChange={(event) => setState((current) => ({ ...current, typography: { ...current.typography, headingWeight: event.target.value } }))}
              />
            </label>
            <label>
              Body weight
              <input
                name="typography.bodyWeight"
                type="number"
                min={100}
                max={900}
                step={100}
                value={state.typography.bodyWeight}
                onChange={(event) => setState((current) => ({ ...current, typography: { ...current.typography, bodyWeight: event.target.value } }))}
              />
            </label>
            <label>
              Scale
              <select name="typography.scale" value={state.typography.scale} onChange={(event) => setState((current) => ({ ...current, typography: { ...current.typography, scale: event.target.value } }))}>
                <option value="standard">standard</option>
                <option value="editorial">editorial</option>
                <option value="bold">bold</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="theme-studio-section">
          <legend>Layout</legend>
          <div className="theme-studio-layout-grid">
            {layoutFields.map(([key, label, options]) => (
              <label key={key}>
                {label}
                <select name={`layout.${key}`} value={stringThemeValue(state.layout[key])} onChange={(event) => setState((current) => ({ ...current, layout: { ...current.layout, [key]: event.target.value } }))}>
                  {options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <label>
              Sticky nav
              <select name="layout.navSticky" value={stringThemeValue(state.layout.navSticky)} onChange={(event) => setState((current) => ({ ...current, layout: { ...current.layout, navSticky: event.target.value } }))}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="theme-studio-section">
          <legend>Spacing and sizes</legend>
          <div className="theme-studio-spacing-grid">
            {spacingFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`spacing.${key}`} value={stringThemeValue(state.spacing[key])} onChange={(event) => setState((current) => ({ ...current, spacing: { ...current.spacing, [key]: event.target.value } }))} placeholder="24px" />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="theme-studio-section">
          <legend>Assets</legend>
          <div className="theme-studio-layout-grid">
            {assetFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={`assets.${key}`} value={stringThemeValue(state.assets[key])} onChange={(event) => setState((current) => ({ ...current, assets: { ...current.assets, [key]: event.target.value } }))} placeholder="https://..." />
              </label>
            ))}
          </div>
        </fieldset>

        <datalist id="theme-fonts">
          {themeFontOptions.map((font) => <option key={font} value={font} />)}
        </datalist>

        <div className="page-editor-actions">
          <button type="submit" className="button-link">{family.isBuiltIn ? 'Save built-in theme overrides' : 'Save theme draft'}</button>
        </div>
      </form>

      <aside className="theme-studio-preview-panel">
        <div className="theme-studio-preview-sticky">
          <div className="theme-studio-preview-header">
            <div>
              <p className="section-kicker">Live preview</p>
              <h3>Mock page object</h3>
              <p className="form-help">This mock updates while you change fonts, colors, and spacing.</p>
            </div>
            <div className="theme-studio-preview-chip-row">
              <span className="status-pill">{state.typography.scale}</span>
              <span className="status-pill">{state.layout.template}</span>
            </div>
          </div>

          <div className="theme-preview theme-studio-preview-shell" style={previewStyle}>
            <div className="preview-brand-row">
              <div className="preview-logo preview-logo-placeholder">M</div>
              <div>
                <p className="preview-eyebrow">Theme mock object</p>
                <strong>{state.name || family.name}</strong>
              </div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: headingColor }}>Chef à domicile à Paris</h2>
            <p style={{ fontFamily: 'var(--font-body)', color: bodyColor, marginBottom: 0 }}>
              Editorial heading, body copy, and spacing are shown here together so you can judge the theme instantly.
            </p>
            <div className="theme-studio-preview-palette">
              {['bg', 'surface', 'primary', 'secondary', 'accent'].map((key) => (
                <span key={key} className="theme-studio-preview-chip" style={{ backgroundColor: previewTheme.colors[key as keyof typeof previewTheme.colors], color: key === 'primary' ? buttonColor : previewTheme.colors.text }}>
                  {key}
                </span>
              ))}
            </div>
            <div className="theme-studio-preview-object" style={{ gap: blockGap, padding: bodyPadding }}>
              <div className="theme-studio-preview-card" style={{ fontFamily: 'var(--font-display)', color: headingColor, padding: bodyPadding }}>
                <span className="preview-eyebrow">H1 sample</span>
                <strong style={{ fontFamily: 'var(--font-display)', color: headingColor }}>Elegant dining with visible hierarchy</strong>
              </div>
              <div className="theme-studio-preview-card" style={{ fontFamily: 'var(--font-body)', padding: bodyPadding }}>
                <span className="preview-eyebrow">Body sample</span>
                <p style={{ color: paragraphColor }}>Spacing, typography, and card rhythm should stay readable when the form changes.</p>
              </div>
            </div>
            <button type="button" style={{ backgroundColor: buttonBackground, color: buttonColor }}>Reserve a table</button>
          </div>

          <div className="theme-studio-preview-summary">
            <div>
              <strong>{headingFamily}</strong>
              <span>Heading font</span>
            </div>
            <div>
              <strong>{bodyFamily}</strong>
              <span>Body font</span>
            </div>
            <div>
              <strong>{state.spacing.pagePadding || '24px'}</strong>
              <span>Page padding</span>
            </div>
            <div>
              <strong>{state.spacing.sectionGap || '64px'}</strong>
              <span>Section gap</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ColorField({
  label,
  name,
  value,
  helpers,
  issue,
  suggestions,
  onChange,
  onAcceptSuggestion,
  onDismissSuggestion,
}: {
  label: string;
  name: string;
  value: string;
  helpers: string[];
  issue?: ThemeColorIssue;
  suggestions: ThemeColorSuggestion[];
  onChange: (value: string) => void;
  onAcceptSuggestion: (value: string) => void;
  onDismissSuggestion: (id: string) => void;
}) {
  const pickerValue = normalizeColor(value);
  const swatches = Array.from(new Set([pickerValue, ...helpers])).slice(0, 7);
  return (
    <label className="theme-studio-color-field">
      <span>{label}</span>
      <div className="theme-studio-color-input-row">
        <input type="color" aria-label={`${label} picker`} value={pickerValue} onChange={(event) => onChange(event.target.value)} />
        <input name={name} value={value} onChange={(event) => onChange(event.target.value)} placeholder="#10233A" />
      </div>
      <div className="theme-studio-color-swatches" aria-label={`${label} helper swatches`}>
        {swatches.map((swatch) => (
          <button key={swatch} type="button" className="theme-studio-color-swatch" style={{ backgroundColor: swatch }} onClick={() => onChange(swatch)} aria-label={`Use ${swatch} for ${label}`} />
        ))}
      </div>
      {issue && suggestions.length ? (
        <div className="theme-studio-suggestion-stack">
          <p className="form-help theme-studio-suggestion-help">{issue.message}</p>
          {suggestions.map((suggestion) => (
            <article key={suggestion.id} className="theme-studio-suggestion-card">
              <div className="theme-studio-suggestion-swatch" style={{ backgroundColor: suggestion.value }} />
              <div className="theme-studio-suggestion-copy">
                <strong>{suggestion.title}</strong>
                <p>{suggestion.description}</p>
                <code>{suggestion.value}</code>
                {typeof suggestion.contrast === 'number' ? <span>{suggestion.contrast.toFixed(1)}:1 contrast</span> : null}
              </div>
              <div className="theme-studio-suggestion-actions">
                <button type="button" className="button-link" onClick={() => onAcceptSuggestion(suggestion.value)}>Accept</button>
                <button type="button" className="button-link button-link-danger" onClick={() => onDismissSuggestion(suggestion.id)}>Dismiss</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </label>
  );
}

function buildEditorState(theme: ThemeStudioFamilyView): ThemeEditorState {
  return {
    name: theme.name,
    description: theme.description ?? '',
    colors: Object.fromEntries(colorFields.map(([key]) => [key, theme.theme.colors[key]])),
    typography: {
      ...Object.fromEntries(typographyFields.map(([key]) => [key, stringThemeValue(theme.theme.typography[key])])),
      headingWeight: String(theme.theme.typography.headingWeight),
      bodyWeight: String(theme.theme.typography.bodyWeight),
      scale: theme.theme.typography.scale,
    },
    typographyColors: Object.fromEntries(typographyColorFields.map(([key]) => [key, stringThemeValue(theme.theme.typography[key])])),
    layout: {
      ...Object.fromEntries(layoutFields.map(([key]) => [key, String(theme.theme.layout[key])])),
      navSticky: theme.theme.layout.navSticky ? 'true' : 'false',
    },
    spacing: Object.fromEntries(spacingFields.map(([key]) => [key, stringThemeValue(theme.theme.spacing?.[key])])),
    assets: Object.fromEntries(assetFields.map(([key]) => [key, stringThemeValue(theme.theme.assets?.[key])])),
  };
}

function buildPreviewTheme(baseTheme: ThemePreset, state: ThemeEditorState, name: string): ThemePreset {
  return {
    ...baseTheme,
    name: state.name || name,
    colors: { ...baseTheme.colors, ...state.colors },
    typography: {
      ...baseTheme.typography,
      ...state.typography,
      ...state.typographyColors,
      headingWeight: Number(state.typography.headingWeight) || baseTheme.typography.headingWeight,
      bodyWeight: Number(state.typography.bodyWeight) || baseTheme.typography.bodyWeight,
    },
    layout: {
      ...baseTheme.layout,
      ...state.layout,
      navSticky: state.layout.navSticky === 'true',
    },
    spacing: {
      ...(baseTheme.spacing ?? {}),
      ...state.spacing,
    },
    assets: {
      ...(baseTheme.assets ?? {}),
      ...state.assets,
    },
  };
}

function collectHelperColors(theme: ThemePreset): string[] {
  return Array.from(new Set([
    theme.colors.bg,
    theme.colors.surface,
    theme.colors.surfaceAlt,
    theme.colors.text,
    theme.colors.textMuted,
    theme.colors.border,
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.accent,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.danger,
    theme.colors.primaryContrast,
  ]));
}

function groupColorIssues(issues: ThemeColorIssue[]): Record<string, ThemeColorIssue[]> {
  return issues.reduce<Record<string, ThemeColorIssue[]>>((acc, issue) => {
    (acc[issue.fieldKey] ??= []).push(issue);
    return acc;
  }, {});
}

function buildColorSuggestionsForField(input: {
  fieldKey: string;
  currentValue: string;
  fallbackValue: string;
  helperColors: string[];
  issue?: ThemeColorIssue;
}): ThemeColorSuggestion[] {
  const suggestions = buildThemeColorSuggestions({
    fieldKey: input.fieldKey,
    currentValue: input.currentValue,
    fallbackValue: input.fallbackValue,
    issue: input.issue,
  });

  if (suggestions.length >= 2) return suggestions;

  const helperAlternatives = input.helperColors
    .filter((color) => color.toLowerCase() !== input.currentValue.toLowerCase())
    .slice(0, 2);

  return [...suggestions, ...helperAlternatives.map((value, index) => ({
    id: `${input.fieldKey}:helper-${index}:${value}`,
    title: index === 0 ? 'Palette alternative' : 'Second palette option',
    description: 'A nearby preset palette color with solid contrast.',
    value,
    contrast: input.issue?.contrastAgainst ? undefined : undefined,
  }))].slice(0, 2);
}
