'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { button, type ButtonSize, type ButtonVariant } from './styles';

/*
 * Modal: plum overlay, 18px card, Newsreader title, actions bottom right. Esc and a backdrop click close it.
 * Two ways to open it:
 *  - `trigger`: a button that opens it in place (decline, cancel a visit, confirmations);
 *  - `closeHref`: the page renders it open from a URL flag (e.g. `?note=new`) and closing goes to `closeHref`.
 * It renders into <body>, so sticky columns and the blurred top bar can't trap it. A submit button inside it
 * that belongs to a surrounding form uses the `form` attribute (see ConfirmSubmit).
 */

const DialogContext = createContext<{ close: () => void } | null>(null);

/** The enclosing dialog, if any. Forms use it to close themselves after a successful action. */
export const useDialog = () => useContext(DialogContext);

const noop = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export function Dialog({
  title,
  description,
  children,
  trigger,
  triggerVariant = 'secondary',
  triggerSize = 'md',
  triggerClassName = '',
  unstyledTrigger = false,
  closeHref,
  role = 'dialog',
  width = 'md',
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  trigger?: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
  /** Use only `triggerClassName` (e.g. a menu item). */
  unstyledTrigger?: boolean;
  closeHref?: string;
  role?: 'dialog' | 'alertdialog';
  /** sm 512px (confirmations), md 500px, lg 540px, or an exact max width in px. */
  width?: 'sm' | 'md' | 'lg' | number;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [open, setOpen] = useState(!!closeHref);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const close = useCallback(() => {
    if (closeHref) {
      router.replace(closeHref, { scroll: false });
      return;
    }
    setOpen(false);
    triggerRef.current?.focus();
  }, [closeHref, router]);

  const shown = open && mounted;

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Only the topmost dialog closes (a confirmation can open on top of another dialog).
      const modals = document.querySelectorAll('[aria-modal="true"]');
      if (modals[modals.length - 1] !== panelRef.current) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the first field, or the panel itself.
    const first = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]):not(.hw-peer), textarea, select');
    (first ?? panelRef.current)?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [shown, close]);

  const max = typeof width === 'number' ? '' : width === 'sm' ? 'max-w-[512px]' : width === 'lg' ? 'max-w-[540px]' : 'max-w-[500px]';

  return (
    <DialogContext.Provider value={{ close }}>
      {trigger ? (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className={unstyledTrigger ? triggerClassName : button(triggerVariant, triggerSize, triggerClassName)}
        >
          {trigger}
        </button>
      ) : null}
      {shown
        ? createPortal(
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(42,21,41,0.42)] p-4 text-left font-sans whitespace-normal"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div
                ref={panelRef}
                role={role}
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                style={typeof width === 'number' ? { maxWidth: width } : undefined}
                className={`flex max-h-[calc(100vh-32px)] w-full ${max} flex-col gap-3.5 overflow-auto rounded-[18px] bg-card p-[26px] text-ink shadow-[0_30px_80px_rgba(42,21,41,0.3)] outline-none`}
              >
                <h2 id={titleId} className="font-display text-[26px] font-normal">
                  {title}
                </h2>
                {description ? (
                  <div id={descId} className="text-sm text-muted">
                    {description}
                  </div>
                ) : null}
                {children}
              </div>
            </div>,
            document.body,
          )
        : null}
    </DialogContext.Provider>
  );
}

/** Quiet "Cancel" that closes the enclosing dialog. */
export function DialogCancel({ children = 'Cancel' }: { children?: ReactNode }) {
  const dialog = useDialog();
  return (
    <button type="button" className={button('quiet', 'md', 'px-3.5')} onClick={() => dialog?.close()}>
      {children}
    </button>
  );
}

/** The action row at the bottom right of a dialog. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-2">{children}</div>;
}
