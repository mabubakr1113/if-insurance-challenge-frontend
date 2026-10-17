import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import type { ActionState } from './action-state';
import { clearActor } from './actor';
import { ApiError, fieldErrors, UNREACHABLE_MESSAGE } from './errors';

/* Helpers shared by the server actions in app/actions. */

const FRIENDLY: Record<string, string> = {
  slot_unavailable: 'That time was just taken. Pick another.',
  last_coordinator: 'The home needs at least one coordinator.',
  home_closed: 'This plan is closed, so it can’t be changed. Everything stays readable.',
  already_accepted: 'This invitation was already accepted.',
  occupancy_not_confirmed: 'Please confirm on step 1 that nobody lives in the home.',
  authority_confirmation_required: 'Please confirm that you can authorise access to the home for this visit.',
  backend_unreachable: UNREACHABLE_MESSAGE,
};

/** Turns a thrown error into form state. A stale cookie sends the person back to the demo page. */
export async function failure(err: unknown, messages: Record<string, string> = {}): Promise<ActionState> {
  unstable_rethrow(err);
  if (err instanceof ApiError) {
    if (!messages[err.code] && (err.status === 401 || err.code === 'removed')) {
      await clearActor();
      redirect('/demo');
    }
    const fields = err.status === 400 ? fieldErrors(err.details) : {};
    const hasFields = Object.keys(fields).some((k) => k !== '_form');
    return {
      ok: false,
      error: messages[err.code] ?? FRIENDLY[err.code] ?? (hasFields ? 'Please check the highlighted fields.' : err.message),
      fieldErrors: fields,
      at: Date.now(),
    };
  }
  console.error(err);
  return { ok: false, error: 'Something went wrong. Please try again.', at: Date.now() };
}

/** Every page reads live data per request, so a mutation simply refreshes everything. */
export function refreshAll(): void {
  revalidatePath('/', 'layout');
}

/**
 * Runs an API call, then refreshes pages and either redirects or returns a success message.
 * `redirect()` stays outside the try so it isn't swallowed.
 */
export async function act<T>(
  fn: () => Promise<T>,
  done: { message?: string | ((result: T) => string); redirect?: (result: T) => string; errors?: Record<string, string> } = {},
): Promise<ActionState> {
  let result: T;
  try {
    result = await fn();
  } catch (err) {
    return failure(err, done.errors);
  }
  refreshAll();
  if (done.redirect) redirect(done.redirect(result));
  const message = typeof done.message === 'function' ? done.message(result) : done.message;
  return { ok: true, message, at: Date.now() };
}

export const invalid = (fieldErrors: Record<string, string>, error = 'Please check the highlighted fields.'): ActionState => ({
  ok: false,
  error,
  fieldErrors,
  at: Date.now(),
});

/* ---------------- FormData readers ---------------- */

export function text(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === 'string' ? v.trim() : '';
}

/** Trimmed text, or undefined when empty (for optional body fields). */
export function optional(fd: FormData, name: string): string | undefined {
  return text(fd, name) || undefined;
}

/** Trimmed text, or null when empty (for nullable patch fields). */
export function nullable(fd: FormData, name: string): string | null {
  return text(fd, name) || null;
}

export const checked = (fd: FormData, name: string) => fd.get(name) === 'on' || fd.get(name) === 'true';

export function number(fd: FormData, name: string): number | null {
  const raw = text(fd, name).replace(',', '.').replace('−', '-');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export const all = (fd: FormData, name: string) => fd.getAll(name).filter((v): v is string => typeof v === 'string' && v !== '');

/** A value that must be one of a fixed set, or null. */
export function oneOf<T extends string>(fd: FormData, name: string, allowed: readonly T[]): T | null {
  const v = text(fd, name);
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}
