import 'server-only';
import { all, number, optional, text } from './actions';
import type { CheckInput, CheckResult } from './contract';

const RESULTS: CheckResult[] = ['ok', 'concern', 'not_checked'];

/** Reads the checklist, temperature, notes and photos shared by family visits and partner reports. */
export function readReport(fd: FormData): {
  checks: CheckInput[];
  indoorTempC: number | null;
  notes?: string;
  photoIds?: string[];
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const checks: CheckInput[] = [];
  for (const key of all(fd, 'checkKeys')) {
    const raw = text(fd, `check.${key}.result`);
    const result = (RESULTS as string[]).includes(raw) ? (raw as CheckResult) : 'not_checked';
    const note = optional(fd, `check.${key}.note`);
    if (result === 'concern' && !note) errors[`check.${key}.note`] = 'Say what you saw, so someone can follow it up.';
    checks.push({ key, result, note });
  }
  if (!checks.some((c) => c.result !== 'not_checked')) errors.checks = 'Mark at least one check before saving.';
  const temp = number(fd, 'indoorTempC');
  if (temp !== null && Number.isNaN(temp)) errors.indoorTempC = 'Enter a number, like 17.5';
  else if (temp !== null && (temp < -40 || temp > 50)) errors.indoorTempC = 'Enter a temperature between −40 and 50 °C';
  const photoIds = all(fd, 'photoIds');
  return {
    checks,
    indoorTempC: temp === null || Number.isNaN(temp) ? null : Math.round(temp * 10) / 10,
    notes: optional(fd, 'notes'),
    photoIds: photoIds.length ? photoIds : undefined,
    errors,
  };
}
