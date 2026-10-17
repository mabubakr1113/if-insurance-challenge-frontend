/* Shared class names, so server and client components style controls the same way. */

const control =
  'block w-full rounded-lg border border-line bg-card px-3 py-2 text-base text-ink shadow-xs placeholder:text-muted/70 disabled:bg-soft disabled:text-muted';

export const input = control;
export const select = control;
export const textarea = `${control} min-h-24`;
export const checkbox = 'mt-0.5 size-5 shrink-0 rounded border-line accent-[var(--color-accent)]';
export const radio = 'mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]';

const button =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export const btn = `${button} bg-accent text-white hover:bg-accent-strong`;
export const btnSecondary = `${button} border border-line bg-card text-ink hover:bg-soft`;
export const btnQuiet = `${button} px-2 text-accent underline-offset-4 hover:underline`;
export const btnSmall = 'px-3 py-1.5 text-sm';

export const link = 'font-medium text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent';
