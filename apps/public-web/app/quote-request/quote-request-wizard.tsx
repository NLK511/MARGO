'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuoteRequestModuleConfig, QuoteRequestQuestion } from '@margo/db';

export function QuoteRequestWizard({ tenantSlug, config, confirmationBasePath }: { tenantSlug: string; config: QuoteRequestModuleConfig; confirmationBasePath: string }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const [transitionSerial, setTransitionSerial] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [previousStepIndex, setPreviousStepIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [lead, setLead] = useState({ firstName: '', lastName: '', displayName: '', email: '', phone: '', company: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = config.questions[stepIndex];
  const isLeadStep = stepIndex >= config.questions.length;
  const totalSteps = config.questions.length + 1;
  const stepTransition = config.stepTransition ?? 'slide';

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function beginTransition(nextIndex: number, direction: 'forward' | 'back') {
    if (nextIndex === stepIndex) return;

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setPreviousStepIndex(stepIndex);
    setStepDirection(direction);
    setTransitionSerial((value) => value + 1);
    setTransitioning(stepTransition !== 'none');
    setStepIndex(nextIndex);

    if (stepTransition === 'none') {
      setPreviousStepIndex(null);
      setTransitioning(false);
      return;
    }

    transitionTimerRef.current = setTimeout(() => {
      setTransitioning(false);
      setPreviousStepIndex(null);
      transitionTimerRef.current = null;
    }, transitionDurationMs(stepTransition));
  }

  function nextStep() {
    const current = question;
    if (current && current.required && isEmptyAnswer(answers[current.id])) {
      setError('Please answer this question before continuing.');
      return;
    }
    setError('');
    beginTransition(Math.min(stepIndex + 1, config.questions.length), 'forward');
  }

  function prevStep() {
    setError('');
    beginTransition(Math.max(stepIndex - 1, 0), 'back');
  }

  async function submitRequest() {
    if (!lead.displayName.trim() || !lead.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setBusy(true);
    setError('');
    const response = await fetch('/api/v1/public/quote-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantSlug, answers, lead }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? 'Unable to submit the quote request.');
      setBusy(false);
      return;
    }

    const payload = (await response.json()) as { publicToken: string };
    router.push(`${confirmationBasePath}/${payload.publicToken}`);
  }

  return (
    <section className={`section-card quote-request-panel quote-request-style-${config.wizardStyle ?? 'centered-card'}`}>
      <p className="eyebrow">Quote request</p>
      <h1>{config.title}</h1>
      {config.intro ? <p>{config.intro}</p> : null}
      <p className="form-help">
        Step {Math.min(stepIndex + 1, totalSteps)} of {totalSteps}
      </p>

      <div className="quote-request-stage-shell" data-transitioning={transitioning ? 'true' : 'false'} data-step-transition={stepTransition} data-step-direction={stepDirection}>
        {stepTransition !== 'none' && previousStepIndex !== null ? (
          <div
            key={`quote-request-stage-out-${transitionSerial}-${previousStepIndex}`}
            className={`quote-request-stage-panel quote-request-stage-panel-out quote-request-stage-${stepTransition} quote-request-stage-${stepDirection}`}
          >
            {renderStepContent(previousStepIndex, config, answers, lead, setAnswer, setLead)}
          </div>
        ) : null}
        <div
          key={`quote-request-stage-in-${transitionSerial}-${stepIndex}`}
          className={`quote-request-stage-panel quote-request-stage-panel-in quote-request-stage-${stepTransition} quote-request-stage-${stepDirection}`}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            if (!transitioning) return;
            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
            setTransitioning(false);
            setPreviousStepIndex(null);
          }}
        >
          {renderStepContent(stepIndex, config, answers, lead, setAnswer, setLead)}
        </div>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="quote-request-actions">
        <button type="button" className="secondary-action" onClick={prevStep} disabled={stepIndex === 0 || busy || transitioning}>
          Back
        </button>
        {!isLeadStep ? (
          <button type="button" className="primary-action" onClick={nextStep} disabled={transitioning}>
            Next
          </button>
        ) : (
          <button type="button" className="primary-action" onClick={submitRequest} disabled={busy || transitioning}>
            {busy ? 'Sending…' : config.outputMode === 'quote' ? 'Send request and get quote' : 'Send request'}
          </button>
        )}
      </div>
    </section>
  );
}

function renderStepContent(
  index: number,
  config: QuoteRequestModuleConfig,
  answers: Record<string, unknown>,
  lead: { firstName: string; lastName: string; displayName: string; email: string; phone: string; company: string; message: string },
  setAnswer: (questionId: string, value: unknown) => void,
  setLead: (lead: { firstName: string; lastName: string; displayName: string; email: string; phone: string; company: string; message: string }) => void,
) {
  const question = config.questions[index];
  const isLeadStep = index >= config.questions.length;
  if (!isLeadStep && question) {
    return <QuestionStep question={question} value={answers[question.id]} onChange={(value) => setAnswer(question.id, value)} />;
  }
  return <LeadStep fields={config.leadFields} lead={lead} onChange={setLead} />;
}

function QuestionStep({ question, value, onChange }: { question: QuoteRequestQuestion; value: unknown; onChange: (value: unknown) => void }) {
  return (
    <label className="quote-request-step">
      <span>{question.label}</span>
      {question.helpText ? <small>{question.helpText}</small> : null}
      {renderQuestionInput(question, value, onChange)}
    </label>
  );
}

function renderQuestionInput(question: QuoteRequestQuestion, value: unknown, onChange: (value: unknown) => void) {
  if (question.type === 'textarea') return <textarea value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} />;
  if (question.type === 'select') {
    return (
      <select value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose…</option>
        {question.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  if (question.type === 'radio') {
    return (
      <div className="quote-request-options">
        {question.options?.map((option) => (
          <label key={option.value} className="quote-request-option">
            <input type="radio" checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }
  if (question.type === 'checkbox') {
    const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    return (
      <div className="quote-request-options">
        {question.options?.map((option) => (
          <label key={option.value} className="quote-request-option">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }
  if (question.type === 'number') return <input type="number" value={typeof value === 'number' ? value : typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} />;
  if (question.type === 'date') return <input type="date" value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />;
  if (question.type === 'email' || question.type === 'tel' || question.type === 'text') return <input type={question.type} value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} />;
  return <input value={typeof value === 'string' ? value : ''} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} />;
}

function LeadStep({ fields, lead, onChange }: { fields: QuoteRequestModuleConfig['leadFields']; lead: { firstName: string; lastName: string; displayName: string; email: string; phone: string; company: string; message: string }; onChange: (lead: { firstName: string; lastName: string; displayName: string; email: string; phone: string; company: string; message: string }) => void }) {
  return (
    <div className="quote-request-lead-grid">
      {fields.map((field) => {
        const key = field.key as keyof typeof lead;
        return (
          <label key={field.key} className="quote-request-step">
            <span>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea value={lead[key] as string} placeholder={field.placeholder} onChange={(event) => onChange({ ...lead, [field.key]: event.target.value })} />
            ) : (
              <input type={field.type} value={lead[key] as string} placeholder={field.placeholder} onChange={(event) => onChange({ ...lead, [field.key]: event.target.value })} />
            )}
          </label>
        );
      })}
    </div>
  );
}

function isEmptyAnswer(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || value === '';
}

function transitionDurationMs(stepTransition: NonNullable<QuoteRequestModuleConfig['stepTransition']>): number {
  switch (stepTransition) {
    case 'fade':
      return 240;
    case 'zoom':
      return 260;
    case 'none':
      return 0;
    case 'slide':
    default:
      return 320;
  }
}
