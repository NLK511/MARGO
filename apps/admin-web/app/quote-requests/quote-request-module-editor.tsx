'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAdminToast } from '../admin-toast';
import type { QuoteRequestModuleConfig } from '@margo/db';

export function QuoteRequestModuleEditor({ initialConfig }: { initialConfig: QuoteRequestModuleConfig }) {
  const router = useRouter();
  const { pushToast } = useAdminToast();
  const [title, setTitle] = useState(initialConfig.title);
  const [intro, setIntro] = useState(initialConfig.intro ?? '');
  const [recipientEmail, setRecipientEmail] = useState(initialConfig.recipientEmail ?? '');
  const [replyToEmail, setReplyToEmail] = useState(initialConfig.replyToEmail ?? '');
  const [outputMode, setOutputMode] = useState(initialConfig.outputMode);
  const [currency, setCurrency] = useState(initialConfig.currency);
  const [basePriceMinor, setBasePriceMinor] = useState(String(initialConfig.basePriceMinor ?? 0));
  const [estimatedLabel, setEstimatedLabel] = useState(initialConfig.estimatedLabel ?? '');
  const [successTitle, setSuccessTitle] = useState(initialConfig.successTitle ?? '');
  const [successBody, setSuccessBody] = useState(initialConfig.successBody ?? '');
  const [wizardStyle, setWizardStyle] = useState(initialConfig.wizardStyle ?? 'centered-card');
  const [stepTransition, setStepTransition] = useState(initialConfig.stepTransition ?? 'slide');
  const [leadFieldsJson, setLeadFieldsJson] = useState(JSON.stringify(initialConfig.leadFields, null, 2));
  const [questionsJson, setQuestionsJson] = useState(JSON.stringify(initialConfig.questions, null, 2));
  const [message, setMessage] = useState('Edit the wizard settings and save to persist the tenant configuration.');
  const [busy, setBusy] = useState(false);

  const previewCounts = useMemo(() => {
    try {
      const questions = JSON.parse(questionsJson) as unknown[];
      const leadFields = JSON.parse(leadFieldsJson) as unknown[];
      return { questions: Array.isArray(questions) ? questions.length : 0, leadFields: Array.isArray(leadFields) ? leadFields.length : 0 };
    } catch {
      return { questions: 0, leadFields: 0 };
    }
  }, [leadFieldsJson, questionsJson]);

  async function saveConfig() {
    setBusy(true);
    setMessage('Saving quote request settings...');
    let leadFields: unknown;
    let questions: unknown;

    try {
      leadFields = JSON.parse(leadFieldsJson);
      questions = JSON.parse(questionsJson);
    } catch {
      const error = 'Lead fields and questions must be valid JSON arrays.';
      setMessage(error);
      pushToast({ tone: 'error', title: 'Invalid JSON', message: error });
      setBusy(false);
      return;
    }

    const response = await fetch('/admin/quote-request', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          title,
          intro,
          recipientEmail,
          replyToEmail,
          outputMode,
          currency,
          basePriceMinor: Number(basePriceMinor || 0),
          estimatedLabel,
          successTitle,
          successBody,
          wizardStyle,
          stepTransition,
          leadFields,
          questions,
        },
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      const errorMessage = body?.message ?? 'Unable to save quote request settings.';
      setMessage(errorMessage);
      pushToast({ tone: 'error', title: 'Settings not saved', message: errorMessage });
      setBusy(false);
      return;
    }

    setMessage('Quote request settings saved.');
    pushToast({ tone: 'success', title: 'Quote request updated', message: 'Wizard configuration saved for this tenant.' });
    setBusy(false);
    router.refresh();
  }

  return (
    <form className="editor-form quote-request-editor" aria-label="Quote request settings" onSubmit={(event) => { event.preventDefault(); void saveConfig(); }}>
      <label>
        Wizard title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Intro text
        <textarea value={intro} onChange={(event) => setIntro(event.target.value)} />
      </label>
      <label>
        Recipient email
        <input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} />
      </label>
      <label>
        Reply-to email
        <input type="email" value={replyToEmail} onChange={(event) => setReplyToEmail(event.target.value)} />
      </label>
      <label>
        Output mode
        <select value={outputMode} onChange={(event) => setOutputMode(event.target.value === 'quote' ? 'quote' : 'confirmation')}>
          <option value="quote">Quote</option>
          <option value="confirmation">Confirmation only</option>
        </select>
      </label>
      <label>
        Currency
        <input value={currency} onChange={(event) => setCurrency(event.target.value)} />
      </label>
      <label>
        Base price minor
        <input type="number" value={basePriceMinor} onChange={(event) => setBasePriceMinor(event.target.value)} />
      </label>
      <label>
        Estimated label
        <input value={estimatedLabel} onChange={(event) => setEstimatedLabel(event.target.value)} />
      </label>
      <label>
        Success title
        <input value={successTitle} onChange={(event) => setSuccessTitle(event.target.value)} />
      </label>
      <label>
        Success body
        <textarea value={successBody} onChange={(event) => setSuccessBody(event.target.value)} />
      </label>
      <label>
        Form style
        <select value={wizardStyle} onChange={(event) => setWizardStyle(event.target.value as typeof wizardStyle)}>
          <option value="centered-card">Centered card</option>
          <option value="compact">Compact</option>
          <option value="split">Split panel</option>
        </select>
      </label>
      <label>
        Next-step animation
        <select value={stepTransition} onChange={(event) => setStepTransition(event.target.value as typeof stepTransition)}>
          <option value="slide">Slide</option>
          <option value="fade">Fade</option>
          <option value="zoom">Zoom</option>
          <option value="none">None</option>
        </select>
        <span className="form-help">Controls the transition when moving between wizard steps.</span>
      </label>
      <label>
        Lead fields JSON
        <textarea value={leadFieldsJson} onChange={(event) => setLeadFieldsJson(event.target.value)} rows={8} />
      </label>
      <label>
        Questions JSON
        <textarea value={questionsJson} onChange={(event) => setQuestionsJson(event.target.value)} rows={16} />
      </label>
      <div className="form-help">Preview: {previewCounts.questions} questions, {previewCounts.leadFields} lead fields.</div>
      <button className="primary-admin-button" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save quote request settings'}
      </button>
      <p className="form-help">{message}</p>
    </form>
  );
}
