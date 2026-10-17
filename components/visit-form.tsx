'use client';

import { useMemo, useState } from 'react';
import type { FormAction } from '@/lib/action-state';
import type { CheckItem, CheckResult } from '@/lib/contract';
import { ChecklistFields } from './checklist-fields';
import { ActionForm, Field, SubmitButton } from './forms';
import { PhotoPicker } from './photo-picker';
import { input, textarea } from './styles';

/** Mirrors the backend (8.5): an OK on these checks completes the matching open task. */
const CHECK_COMPLETES: Record<string, string> = {
  heating: 'heating_check',
  heat_pump_unit: 'heat_pump_check',
  oil_level: 'oil_level',
  roof_snow: 'roof_snow_check',
  outside: 'storm_check',
};
const ALWAYS = ['monthly_visit', 'first_walkthrough'];

export interface OpenTask {
  id: string;
  title: string;
  templateKey: string | null;
}

/** P12 (family visit) and P24 (partner report). */
export function VisitForm({
  action,
  homeId,
  checklist,
  openTasks = [],
  defaultVisitedAt,
  maxVisitedAt,
  variant,
  submitLabel,
}: {
  action: FormAction;
  homeId: string;
  checklist: CheckItem[];
  openTasks?: OpenTask[];
  defaultVisitedAt?: string;
  maxVisitedAt?: string;
  variant: 'family' | 'partner';
  submitLabel: string;
}) {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const closing = useMemo(
    () =>
      openTasks.filter(
        (t) =>
          !!t.templateKey &&
          (ALWAYS.includes(t.templateKey) || Object.entries(CHECK_COMPLETES).some(([check, key]) => key === t.templateKey && results[check] === 'ok')),
      ),
    [openTasks, results],
  );

  return (
    <ActionForm action={action} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {variant === 'family' ? (
          <Field label="When" name="visitedAt" hint="Helsinki time. Not more than an hour in the future.">
            <input id="visitedAt" name="visitedAt" type="datetime-local" className={input} required defaultValue={defaultVisitedAt} max={maxVisitedAt} />
          </Field>
        ) : null}
        <Field label="Indoor temperature, °C" name="indoorTempC" optional hint="A thermometer reading or the thermostat display">
          <input id="indoorTempC" name="indoorTempC" inputMode="decimal" className={input} placeholder="e.g. 17.5" />
        </Field>
      </div>

      <ChecklistFields items={checklist} onChange={setResults} />

      <PhotoPicker homeId={homeId} canDelete={variant === 'family'} />

      <Field label="General notes" name="notes" optional>
        <textarea id="notes" name="notes" className={textarea} maxLength={2000} />
      </Field>

      {variant === 'family' ? (
        <section aria-labelledby="closes" className="rounded-xl bg-soft p-4">
          <h2 id="closes" className="font-semibold">
            What this visit will close
          </h2>
          {closing.length ? (
            <ul className="mt-2 list-disc pl-5" aria-live="polite">
              {closing.map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              No open tasks are closed by this visit yet.
            </p>
          )}
          <p className="mt-2 text-sm text-muted">Concerns become follow-up tasks automatically.</p>
        </section>
      ) : (
        <p className="text-sm text-muted">Concerns become follow-up tasks for the family automatically.</p>
      )}

      <div>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
