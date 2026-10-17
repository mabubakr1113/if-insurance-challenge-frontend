'use client';

import { useMemo, useState } from 'react';
import type { FormAction } from '@/lib/action-state';
import type { CheckItem, CheckResult } from '@/lib/contract';
import { ActionForm, Field, FieldError, FormMessage, InvalidWrap, SubmitButton, useFormState } from './forms';
import { PhotoPicker } from './photo-picker';
import { button, eyebrow, input, listBox, mainCol, railCol, row, textarea, twoCol } from './styles';
import { Card } from './ui';

/** Mirrors the backend (8.5): an OK on these checks completes the matching open task. */
const CHECK_COMPLETES: Record<string, string> = {
  heating: 'heating_check',
  heat_pump_unit: 'heat_pump_check',
  oil_level: 'oil_level',
  roof_snow: 'roof_snow_check',
  outside: 'storm_check',
};
const ALWAYS = ['monthly_visit', 'first_walkthrough'];

const OPTIONS: { value: CheckResult; label: string; on: string }[] = [
  { value: 'ok', label: 'OK', on: 'border-ok bg-ok-soft text-ok font-bold' },
  { value: 'concern', label: 'Concern', on: 'border-concern bg-concern-soft text-concern font-bold' },
  { value: 'not_checked', label: 'Not checked', on: 'border-muted bg-neutral text-muted font-bold' },
];

export interface OpenTask {
  id: string;
  title: string;
  templateKey: string | null;
}

/** P12 (family visit) and P24 (partner report): main column with the checklist, sticky summary rail. */
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
  const [results, setResults] = useState<Record<string, CheckResult>>(() => Object.fromEntries(checklist.map((i) => [i.key, 'not_checked'])));
  const answered = Object.values(results).filter((r) => r !== 'not_checked').length;
  const concerns = Object.values(results).filter((r) => r === 'concern').length;
  const closing = useMemo(
    () =>
      openTasks.filter(
        (t) =>
          !!t.templateKey &&
          (ALWAYS.includes(t.templateKey) || Object.entries(CHECK_COMPLETES).some(([check, key]) => key === t.templateKey && results[check] === 'ok')),
      ),
    [openTasks, results],
  );

  const set = (key: string, value: CheckResult) => setResults((r) => ({ ...r, [key]: value }));
  const restOk = () => setResults((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === 'not_checked' ? 'ok' : v])));

  return (
    <ActionForm action={action} className={`${twoCol} gap-7`} showMessage={false}>
      <div className={`${mainCol} gap-5`}>
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
          {variant === 'family' ? (
            <Field label="When" name="visitedAt" hint="Helsinki time.">
              <input id="visitedAt" name="visitedAt" type="datetime-local" className={input} defaultValue={defaultVisitedAt} max={maxVisitedAt} />
            </Field>
          ) : null}
          <Field label="Indoor temperature, °C" name="indoorTempC" hint="A thermometer or the thermostat display.">
            <input id="indoorTempC" name="indoorTempC" inputMode="decimal" className={input} placeholder="Optional, e.g. 17.5" autoComplete="off" />
          </Field>
        </div>

        <section aria-labelledby="checklist" className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="checklist" className={eyebrow}>
              Checklist
            </h2>
            <button type="button" onClick={restOk} className={button('secondary', 'xs')}>
              Mark the rest OK
            </button>
          </div>
          <div className={listBox}>
            {checklist.map((item) => (
              <CheckRow key={item.key} item={item} result={results[item.key]} onPick={(v) => set(item.key, v)} />
            ))}
          </div>
        </section>

        <section aria-labelledby="photos-notes" className="flex flex-col gap-2.5">
          <h2 id="photos-notes" className={eyebrow}>
            Photos and notes
          </h2>
          <PhotoPicker homeId={homeId} canDelete={variant === 'family'} showLabel={false} />
          <label htmlFor="notes" className="sr-only">
            General notes
          </label>
          <textarea id="notes" name="notes" className={textarea} maxLength={2000} placeholder="General notes (optional)" />
        </section>
      </div>

      <aside aria-label="Summary" className={railCol}>
        <Card className="gap-3.5" aria-live="polite">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Summary</h2>
            <span className="text-xs text-muted">
              {answered} of {checklist.length} checked
            </span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-line-soft">
            <div className="h-full rounded-full bg-ink transition-[width] duration-[250ms]" style={{ width: `${checklist.length ? (answered / checklist.length) * 100 : 0}%` }} />
          </div>
          {variant === 'family' ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">This visit will close</span>
              {closing.length ? (
                closing.map((t) => (
                  <span key={t.id} className="flex gap-2 text-sm">
                    <span aria-hidden="true" className="text-ok">
                      ✓
                    </span>
                    {t.title}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">No open tasks yet</span>
              )}
            </div>
          ) : null}
          {concerns ? (
            <span className="text-[13px] text-concern">
              {concerns} {concerns === 1 ? 'concern' : 'concerns'} will become follow-up {concerns === 1 ? 'task' : 'tasks'}
              {variant === 'partner' ? ' for the family' : ''}.
            </span>
          ) : null}
          <FieldError name="checks" />
          <FormMessage className="" />
          <SubmitButton block size="lg" pendingText="Saving…">
            {submitLabel}
          </SubmitButton>
        </Card>
      </aside>
    </ActionForm>
  );
}

/** One checklist row: label, the OK / Concern / Not checked control, and "What did you see?" for a concern. */
function CheckRow({ item, result, onPick }: { item: CheckItem; result: CheckResult; onPick: (v: CheckResult) => void }) {
  const { state } = useFormState();
  const noteName = `check.${item.key}.note`;
  const noteError = state.fieldErrors?.[noteName];
  return (
    <div className={`flex flex-col gap-2 py-3 pr-4 pl-[18px] ${row}`}>
      <input type="hidden" name="checkKeys" value={item.key} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
          <span className="text-sm" id={`label-${item.key}`}>
            {item.label}
          </span>
          {item.help ? <span className="text-xs text-faint">{item.help}</span> : null}
        </span>
        <div role="radiogroup" aria-labelledby={`label-${item.key}`} className="flex gap-0.5 rounded-[10px] bg-tri p-[3px]">
          {OPTIONS.map((o) => {
            const on = result === o.value;
            return (
              <label
                key={o.value}
                className={`relative flex h-[30px] cursor-pointer items-center rounded-[7px] border px-[11px] text-xs select-none ${on ? o.on : 'border-line-input bg-white font-medium text-muted hover:text-ink'}`}
              >
                <input type="radio" name={`check.${item.key}.result`} value={o.value} checked={on} onChange={() => onPick(o.value)} className="hw-peer" />
                {o.label}
              </label>
            );
          })}
        </div>
      </div>
      {result === 'concern' ? (
        <InvalidWrap name={noteName} className="flex flex-col gap-1">
          <label htmlFor={`note-${item.key}`} className="sr-only">
            What did you see? ({item.label})
          </label>
          <input
            id={`note-${item.key}`}
            name={noteName}
            maxLength={2000}
            placeholder="What did you see?"
            autoComplete="off"
            className="h-[38px] rounded-[9px] border border-concern-line bg-concern-field px-3 text-sm text-ink placeholder:text-faint focus:border-concern focus:outline-none focus-visible:outline-none"
          />
          {noteError ? (
            <span role="alert" className="text-[13px] text-concern">
              {noteError}
            </span>
          ) : null}
        </InvalidWrap>
      ) : null}
    </div>
  );
}
