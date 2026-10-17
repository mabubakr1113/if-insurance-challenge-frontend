'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { fmtDate } from '@/lib/format';
import { Icon } from './icons';
import { button, label } from './styles';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const asDate = (value: string) => new Date(`${value}T12:00:00Z`);
const ymd = (date: Date) => date.toISOString().slice(0, 10);

function addDays(value: string, amount: number): string {
  const date = asDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return ymd(date);
}

function shiftMonth(value: string, amount: number): string {
  const date = asDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return ymd(date);
}

/** A bounded calendar using the same colours, typography and controls as the rest of the app. */
export function DatePicker({
  id,
  name,
  defaultValue,
  min,
  max,
  describedBy,
  invalid = false,
}: {
  id: string;
  name: string;
  defaultValue: string;
  min: string;
  max: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const clamp = (date: string) => date < min ? min : date > max ? max : date;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(defaultValue);
  const [month, setMonth] = useState(defaultValue.slice(0, 7));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const calendar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [open, focused, month]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function select(date: string) {
    setValue(date);
    // Keep the app's background refresh from replacing an unsubmitted selection.
    trigger.current?.closest('form')?.setAttribute('data-dirty', 'true');
    close();
  }

  function moveFocus(date: string) {
    const next = clamp(date);
    setFocused(next);
    setMonth(next.slice(0, 7));
  }

  function onDayKey(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = (asDate(date).getUTCDay() + 6) % 7;
    const next: Record<string, () => string> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -weekday),
      End: () => addDays(date, 6 - weekday),
      PageUp: () => shiftMonth(date, -1),
      PageDown: () => shiftMonth(date, 1),
    };
    if (next[event.key]) {
      event.preventDefault();
      moveFocus(next[event.key]());
    }
  }

  const first = `${month}-01`;
  const offset = (asDate(first).getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  return (
    <div
      ref={root}
      className="relative flex w-[240px] max-w-full min-w-0 flex-col gap-1.5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <label id={`${id}-label`} htmlFor={id} className={label}>Date</label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-calendar` : undefined}
        onClick={() => {
          setFocused(clamp(value));
          setMonth(clamp(value).slice(0, 7));
          setOpen((shown) => !shown);
        }}
        className={`flex h-11 cursor-pointer items-center justify-between gap-4 rounded-[10px] border bg-card px-3 text-left text-[15px] text-ink transition-colors hover:bg-hover-btn ${invalid ? 'border-error-border' : open ? 'border-ink ring-3 ring-accent-soft' : 'border-line-input'}`}
      >
        <span id={`${id}-value`}>{fmtDate(value, { year: true })}</span>
        <Icon name="visits" size={18} className="text-muted" />
      </button>
      {open ? (
        <div
          ref={calendar}
          id={`${id}-calendar`}
          role="dialog"
          aria-label="Choose weather date"
          className="absolute top-full left-0 z-30 mt-2 w-[min(304px,calc(100vw-80px))] rounded-2xl border border-line bg-card p-4 text-ink shadow-[0_12px_36px_rgba(42,21,41,0.14)]"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" aria-label="Previous month" disabled={month <= min.slice(0, 7)} onClick={() => moveFocus(shiftMonth(focused, -1))} className={button('quiet', 'sm', 'w-8 px-0')}>
              <Icon name="back" size={16} />
            </button>
            <h3 aria-live="polite" className="font-display text-[23px] font-normal">{monthFormat.format(asDate(first))}</h3>
            <button type="button" aria-label="Next month" disabled={month >= max.slice(0, 7)} onClick={() => moveFocus(shiftMonth(focused, 1))} className={button('quiet', 'sm', 'w-8 px-0')}>
              <Icon name="next" size={16} />
            </button>
          </div>
          <table className="w-full table-fixed border-separate border-spacing-1" aria-label={monthFormat.format(asDate(first))}>
            <thead>
              <tr>{WEEKDAYS.map((day) => <th key={day} scope="col" className="pb-1.5 text-center text-[11px] font-semibold text-muted">{day}</th>)}</tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week}>
                  {days.slice(week * 7, week * 7 + 7).map((date) => {
                    const disabled = date < min || date > max;
                    const selected = date === value;
                    return (
                      <td key={date} className="p-0 text-center">
                        <button
                          type="button"
                          data-date={date}
                          aria-label={fmtDate(date, { year: true })}
                          aria-pressed={selected}
                          aria-current={date === min ? 'date' : undefined}
                          disabled={disabled}
                          tabIndex={date === focused ? 0 : -1}
                          onFocus={() => setFocused(date)}
                          onKeyDown={(event) => onDayKey(event, date)}
                          onClick={() => select(date)}
                          className={`relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg text-[13px] transition-colors disabled:cursor-not-allowed disabled:text-faint/45 ${selected ? 'bg-ink font-semibold text-white' : disabled ? '' : 'hover:bg-hover-btn'} ${date.slice(0, 7) !== month && !selected ? 'text-muted' : ''} ${date === min && !selected ? 'font-semibold ring-1 ring-inset ring-line-input' : ''}`}
                        >
                          {asDate(date).getUTCDate()}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
            <button type="button" className={button('quiet', 'sm')} onClick={() => select(min)}>Today</button>
            <button type="button" className={button('quiet', 'sm')} onClick={close}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
