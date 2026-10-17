import type { ReactNode } from 'react';
import { FieldError } from './forms';
import { checkbox, chip, hint as hintClass, type ChipSize } from './styles';

/**
 * Pill choices: a real radio inside each chip, so it works without JS and posts with the form.
 * Unselected: white with a soft border. Selected: plum with white text.
 */
export function ChipGroup({
  legend,
  name,
  choices,
  defaultValue,
  hint,
  size = 'md',
  legendSize = 'md',
  className = '',
}: {
  legend: ReactNode;
  name: string;
  choices: { value: string; label: ReactNode }[];
  defaultValue?: string | null;
  hint?: ReactNode;
  size?: ChipSize;
  /** `hidden`: the chips speak for themselves; the legend is for screen readers only. */
  legendSize?: 'sm' | 'md' | 'hidden';
  className?: string;
}) {
  return (
    <fieldset className={`flex min-w-0 flex-col gap-2.5 ${className}`}>
      <legend className={legendSize === 'hidden' ? 'sr-only' : `font-semibold ${legendSize === 'md' ? 'mb-2.5 text-[15px]' : 'mb-2 text-sm'}`}>{legend}</legend>
      {hint ? <p className={`-mt-1.5 ${hintClass}`}>{hint}</p> : null}
      <div className={`flex flex-wrap ${size === 'sm' ? 'gap-1.5' : 'gap-2'}`}>
        {choices.map((c) => (
          <label key={c.value} className={chip(size)}>
            <input type="radio" name={name} value={c.value} defaultChecked={defaultValue === c.value} className="hw-peer" />
            {c.label}
          </label>
        ))}
      </div>
      <FieldError name={name} />
    </fieldset>
  );
}

/** A checkbox with a label and an optional one-line description. */
export function Checkbox({
  name,
  children,
  description,
  defaultChecked,
  disabled,
  size = 'md',
  className = '',
}: {
  name: string;
  children: ReactNode;
  description?: ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <label className={`flex cursor-pointer gap-2.5 text-ink ${description ? 'items-start' : 'items-center'} ${size === 'sm' ? 'text-[13px] leading-[1.4]' : 'text-sm'} ${className}`}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className={`${checkbox} ${size === 'sm' ? 'hw-check-sm' : ''} ${description ? 'mt-px' : ''}`} />
      <span className={`flex flex-col gap-0.5 ${description ? 'pt-px' : ''}`}>
        <span>{children}</span>
        {description ? <span className="text-[13px] text-muted">{description}</span> : null}
      </span>
    </label>
  );
}
