/* Shared class names, so server and client components style controls the same way. */

/* ---------------- buttons ---------------- */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'quiet' | 'danger' | 'dangerQuiet' | 'sim';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const BUTTON_BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-ink text-white hover:bg-ink-strong',
  secondary: 'border border-line-input bg-card text-ink hover:bg-hover-btn',
  outline: 'border border-ink bg-transparent text-ink hover:bg-white/60',
  quiet: 'border border-transparent bg-transparent text-muted hover:text-ink',
  danger: 'border border-transparent bg-concern text-white hover:bg-concern-strong',
  dangerQuiet: 'border border-transparent bg-transparent text-concern hover:bg-concern-soft',
  sim: 'border border-dashed border-sim-line bg-sim text-attention-ink hover:bg-attention-soft',
};

const SIZE: Record<ButtonSize, string> = {
  xs: 'h-[30px] rounded-lg px-3 text-xs',
  sm: 'h-8 rounded-lg px-3 text-[13px]',
  md: 'h-[42px] rounded-[10px] px-4 text-sm',
  lg: 'h-[46px] rounded-[10px] px-4 text-sm',
  /** Setup's Back and Continue. */
  xl: 'h-11 rounded-[10px] px-[18px] text-sm',
};

export function button(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return `${BUTTON_BASE} ${VARIANT[variant]} ${SIZE[size]} ${extra}`.trim();
}

export const btn = button('primary');
export const btnSecondary = button('secondary');
export const btnQuiet = button('quiet');

/** "Care plan →" and other small text actions. */
export const arrowLink = 'cursor-pointer text-[13px] font-semibold text-muted hover:text-ink';

/** Inline text link: plum with a coral underline. */
export const link = 'font-semibold text-ink underline decoration-accent decoration-1 underline-offset-4 hover:text-accent-text';

/** "‹ Care plan" above a page title. */
export const backLink = 'inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted hover:text-ink';

/* ---------------- form controls ---------------- */

const CONTROL =
  'block w-full rounded-[10px] border border-line-input bg-white px-3 text-[15px] text-ink placeholder:text-faint focus:border-ink focus:ring-3 focus:ring-accent-soft focus:outline-none focus-visible:outline-none disabled:bg-soft disabled:text-muted';

/** The control without a height, for compact variants. */
export const control = CONTROL;
export const input = `${CONTROL} h-11`;
export const select = `${CONTROL} h-11 pr-8`;
/** A textarea without a minimum height, for other sizes. */
export const textareaBase = `${CONTROL} resize-y py-2.5 leading-normal`;
export const textarea = `${textareaBase} min-h-[84px]`;
export const checkbox = 'hw-check';
export const radio = 'hw-radio';

/** Field label: 13–14px semibold. */
export const label = 'text-sm font-semibold text-ink';
export const fieldError = 'text-[13px] text-concern';
export const hint = 'text-[13px] text-muted';

/* ---------------- choice chips (a styled radio or checkbox inside a label) ---------------- */

export type ChipSize = 'sm' | 'md' | 'lg';

const CHIP_SIZE: Record<ChipSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-[13px] text-[13px]',
  lg: 'h-10 px-4 text-sm',
};

export const chip = (size: ChipSize = 'sm') =>
  `relative inline-flex cursor-pointer items-center justify-center rounded-full border border-line-input bg-white font-semibold text-ink select-none hover:bg-hover-btn has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white ${CHIP_SIZE[size]}`;

/* ---------------- surfaces ---------------- */

export const card = 'min-w-0 rounded-2xl border border-line bg-card';
export const listBox = 'flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card';
/** A row inside a list container. The negative margin hides the last divider. */
export const row = '-mb-px border-b border-line-soft';
export const rowHover = 'transition-colors hover:bg-hover';

export const eyebrow = 'text-xs font-bold tracking-[0.07em] text-faint uppercase';
export const h1 = 'font-display text-[36px] leading-[1.08] font-normal tracking-[-0.025em] text-ink';
export const intro = 'text-[15px] leading-[1.55] text-muted';

/** Two-column screens: main column and sticky rail. */
export const twoCol = 'flex flex-wrap items-start';
export const mainCol = 'flex min-w-0 flex-[999_1_440px] flex-col';
export const railCol = 'flex min-w-0 flex-[1_1_290px] flex-col gap-3.5 wide:sticky wide:top-6';

/** Grids collapse to one column on narrow screens. Literal class names, so Tailwind finds them. */
export const grid = {
  150: 'grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]',
  180: 'grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr))]',
  190: 'grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))]',
  200: 'grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]',
  220: 'grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]',
  300: 'grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]',
  340: 'grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]',
  360: 'grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]',
} as const;
