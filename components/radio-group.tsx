import type { ReactNode } from 'react';
import { FieldError } from './forms';
import { radio } from './styles';

/** A labelled group of radio buttons with optional one-line descriptions. */
export function RadioGroup({
  legend,
  name,
  choices,
  defaultValue,
  hint,
  columns = false,
  required,
}: {
  legend: ReactNode;
  name: string;
  choices: { value: string; label: ReactNode; description?: ReactNode }[];
  defaultValue?: string | null;
  hint?: ReactNode;
  columns?: boolean;
  required?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className={columns ? 'grid gap-2 sm:grid-cols-2' : 'flex flex-col gap-2'}>
        {choices.map((c) => (
          <label key={c.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-card px-3 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
            <input type="radio" name={name} value={c.value} defaultChecked={defaultValue === c.value} className={radio} required={required} />
            <span>
              <span className="block">{c.label}</span>
              {c.description ? <span className="block text-sm text-muted">{c.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      <FieldError name={name} />
    </fieldset>
  );
}
