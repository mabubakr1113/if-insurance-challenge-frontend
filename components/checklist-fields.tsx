'use client';

import { useState } from 'react';
import type { CheckItem, CheckResult } from '@/lib/contract';
import { CHECK_RESULT } from '@/lib/labels';
import { useFormState } from './forms';
import { radio, textarea } from './styles';

const RESULTS: CheckResult[] = ['ok', 'concern', 'not_checked'];

/**
 * The visit checklist: a result per item (default Not checked) and a note, required for a concern.
 * Submits `checkKeys`, `check.<key>.result` and `check.<key>.note`.
 */
export function ChecklistFields({ items, onChange }: { items: CheckItem[]; onChange?: (results: Record<string, CheckResult>) => void }) {
  const [results, setResults] = useState<Record<string, CheckResult>>(() => Object.fromEntries(items.map((i) => [i.key, 'not_checked'])));
  const { state } = useFormState();

  function set(key: string, value: CheckResult) {
    const next = { ...results, [key]: value };
    setResults(next);
    onChange?.(next);
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-semibold">Checklist</legend>
      {items.map((item) => {
        const result = results[item.key];
        const noteError = state.fieldErrors?.[`check.${item.key}.note`];
        return (
          <div key={item.key} className={`rounded-xl border p-4 ${result === 'concern' ? 'border-concern/40 bg-concern-soft/40' : result === 'ok' ? 'border-ok/30 bg-ok-soft/40' : 'border-line bg-card'}`}>
            <input type="hidden" name="checkKeys" value={item.key} />
            <fieldset>
              <legend className="font-medium">{item.label}</legend>
              <p className="text-sm text-muted">{item.help}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {RESULTS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm has-[:checked]:border-accent has-[:checked]:font-semibold">
                    <input type="radio" name={`check.${item.key}.result`} value={r} checked={result === r} onChange={() => set(item.key, r)} className={radio} />
                    {CHECK_RESULT[r]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor={`note-${item.key}`} className="mt-3 block text-sm">
              {result === 'concern' ? 'What did you see?' : 'Note'}
              {result === 'concern' ? null : <span className="text-muted"> (optional)</span>}
            </label>
            <textarea
              id={`note-${item.key}`}
              name={`check.${item.key}.note`}
              className={`${textarea} mt-1 min-h-16`}
              required={result === 'concern'}
              maxLength={2000}
              aria-invalid={noteError ? true : undefined}
            />
            {noteError ? (
              <p className="mt-1 text-sm font-medium text-concern" role="alert">
                {noteError}
              </p>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}
