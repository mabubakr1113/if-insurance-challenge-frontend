/* Dates, money, temperature and relative time (9.2). Everything is shown in Europe/Helsinki. */

export const TZ = 'Europe/Helsinki';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const numericFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** `YYYY-MM-DD` dates are calendar days: read them at noon UTC so they stay the same day in Helsinki. */
function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
}

function parts(value: string | Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(toDate(value))) out[p.type] = p.value;
  return out;
}

/** `Tue 21 Oct` (with the year when it isn't this year). */
export function fmtDate(value: string | Date, opts: { year?: boolean } = {}): string {
  const p = parts(value);
  const showYear = opts.year ?? p.year !== parts(new Date()).year;
  return `${p.weekday} ${p.day} ${p.month}${showYear ? ` ${p.year}` : ''}`;
}

/** `18:00` */
export function fmtTime(value: string | Date): string {
  const p = parts(value);
  return `${p.hour}:${p.minute}`;
}

/** `Tue 21 Oct, 18:00` */
export function fmtDateTime(value: string | Date, opts: { year?: boolean } = {}): string {
  return `${fmtDate(value, opts)}, ${fmtTime(value)}`;
}

/** `Tue 21 Oct · 09:00–11:00` */
export function fmtSlot(start: string, end: string): string {
  return `${fmtDate(start)} · ${fmtTime(start)}–${fmtTime(end)}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** `12 min ago`, `3 h ago`, `2 days ago`, `in 2 days` */
export function fmtRelative(value: string | Date, now = Date.now()): string {
  const diff = toDate(value).getTime() - now;
  const abs = Math.abs(diff);
  let text: string;
  if (abs < MINUTE) return 'just now';
  if (abs < HOUR) text = `${Math.round(abs / MINUTE)} min`;
  else if (abs < DAY) text = `${Math.round(abs / HOUR)} h`;
  else text = plural(Math.round(abs / DAY), 'day');
  return diff < 0 ? `${text} ago` : `in ${text}`;
}

/** `3 days overdue`; under a day just `Overdue`. */
export function fmtOverdue(dueAt: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(dueAt).getTime()) / DAY);
  return days >= 1 ? `${plural(days, 'day')} overdue` : 'Overdue';
}

/** Whole days between now and a timestamp (positive = in the future). */
export function daysUntil(value: string, now = Date.now()): number {
  return Math.ceil((toDate(value).getTime() - now) / DAY);
}

/** `−18 °C` with a real minus sign. */
export function fmtTemp(c: number | null | undefined): string {
  if (c === null || c === undefined) return '–';
  const rounded = Math.round(c * 10) / 10;
  const text = Number.isInteger(rounded) ? String(Math.abs(rounded)) : Math.abs(rounded).toFixed(1);
  return `${rounded < 0 ? '−' : ''}${text} °C`;
}

export const fmtWind = (ms: number) => `${Math.round(ms)} m/s`;
export const fmtSnow = (cm: number) => `${Math.round(cm)} cm`;

/** `€69`, or `€69.50` with cents. */
export function fmtMoney(cents: number): string {
  const euros = cents / 100;
  return `€${Number.isInteger(euros) ? euros : euros.toFixed(2)}`;
}

/** `82%` */
export const fmtRate = (rate: number) => `${Math.round(rate * 100)}%`;

export const fmtCount = (n: number, singular: string, pluralWord = `${singular}s`) => `${n} ${n === 1 ? singular : pluralWord}`;

/* ---------------- Helsinki wall time <-> UTC, for date and time inputs ---------------- */

function helsinkiFields(date: Date) {
  const out: Record<string, number> = {};
  for (const p of numericFmt.formatToParts(date)) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Helsinki's offset from UTC at a moment, in ms. */
function offsetAt(ms: number): number {
  const f = helsinkiFields(new Date(ms));
  return Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second) - Math.floor(ms / 1000) * 1000;
}

/** `YYYY-MM-DD` in Helsinki. */
export function helsinkiYmd(value: string | Date = new Date()): string {
  const f = helsinkiFields(toDate(value));
  return `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`;
}

/** A value for `<input type="datetime-local">`: `YYYY-MM-DDTHH:mm` in Helsinki. */
export function toLocalInput(value: string | Date): string {
  const f = helsinkiFields(toDate(value));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${f.year}-${pad(f.month)}-${pad(f.day)}T${pad(f.hour)}:${pad(f.minute)}`;
}

/** `YYYY-MM-DDTHH:mm` (Helsinki wall time) → ISO UTC string. Null when it doesn't parse. */
export function fromLocalInput(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let ms = guess - offsetAt(guess);
  ms = guess - offsetAt(ms);
  return new Date(ms).toISOString();
}

/** Today + n days at a Helsinki wall-clock time, as a datetime-local value. */
export function localInputInDays(days: number, time = '18:00'): string {
  const date = helsinkiYmd(new Date(Date.now() + days * DAY));
  return `${date}T${time}`;
}
