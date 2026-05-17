import React from 'react';
import type { QuoteRequestEstimateLine, QuoteRequestRecord } from '@margo/db';

export function QuoteRequestConfirmation({ request }: { request: QuoteRequestRecord }) {
  const config = toRecord(request.configSnapshot);
  const questions = Array.isArray(config.questions) ? config.questions.map(toRecord) : [];
  const successTitle = typeof config.successTitle === 'string' ? config.successTitle : 'Request received';
  const successBody = typeof config.successBody === 'string' ? config.successBody : 'We will review your request and contact you shortly.';
  const answerEntries = formatAnswerEntries(request.answers, questions);
  const breakdown = formatBreakdown(request.quoteBreakdown);

  return (
    <section className="section-card quote-request-confirmation">
      <p className="eyebrow">Quote request sent</p>
      <h1>{successTitle}</h1>
      <p>{successBody}</p>

      <div className="quote-request-confirmation-grid">
        <article className="quote-request-confirmation-block">
          <h2>Request summary</h2>
          <dl className="quote-request-dl">
            <div>
              <dt>Name</dt>
              <dd>{request.requesterName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{request.requesterEmail ?? 'No email provided'}</dd>
            </div>
            {request.requesterPhone ? (
              <div>
                <dt>Phone</dt>
                <dd>{request.requesterPhone}</dd>
              </div>
            ) : null}
            {request.requesterCompany ? (
              <div>
                <dt>Company</dt>
                <dd>{request.requesterCompany}</dd>
              </div>
            ) : null}
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(request.submittedAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="quote-request-confirmation-block">
          <h2>Your answers</h2>
          {answerEntries.length ? (
            <ul className="quote-request-list">
              {answerEntries.map((entry) => (
                <li key={entry.label} className="quote-request-list-item">
                  <span className="quote-request-label">{entry.label}</span>
                  <span className="quote-request-answer-value">{entry.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No answers provided.</p>
          )}
        </article>
      </div>

      {request.outputMode === 'quote' && typeof request.quoteMinor === 'number' ? (
        <article className="quote-request-confirmation-block quote-request-confirmation-total">
          <h2>{typeof config.estimatedLabel === 'string' ? config.estimatedLabel : 'Estimated price'}</h2>
          <p className="quote-request-total">{formatMoney(request.quoteMinor, request.currency ?? 'EUR')}</p>
          {breakdown.length ? (
            <ul className="quote-request-breakdown">
              {breakdown.map((line, index) => (
                <li key={`${line.label}-${index}`}>
                  <span>{line.label}</span>
                  <span>{formatMoney(line.amountMinor, request.currency ?? 'EUR')}</span>
                  {line.note ? <small>{line.note}</small> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

function formatAnswerEntries(answers: unknown, questions: Record<string, unknown>[]): Array<{ label: string; value: string }> {
  const record = toRecord(answers);
  return Object.entries(record).map(([key, value]) => {
    const question = questions.find((item) => typeof item.id === 'string' && item.id === key);
    const label = typeof question?.label === 'string' ? question.label : prettifyKey(key);
    return { label, value: formatInlineValue(value) };
  });
}

function formatBreakdown(value: unknown): QuoteRequestEstimateLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isPlainObject(entry) || typeof entry.label !== 'string' || typeof entry.amountMinor !== 'number') return [];
    return [{ label: entry.label, kind: 'option', amountMinor: entry.amountMinor, ...(typeof entry.note === 'string' ? { note: entry.note } : {}) }];
  });
}

function formatInlineValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatInlineValue).join(', ');
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (value == null) return '—';
  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, nested]) => `${prettifyKey(key)}: ${formatInlineValue(nested)}`)
      .join(', ');
  }
  return String(value);
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amountMinor / 100);
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function prettifyKey(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
