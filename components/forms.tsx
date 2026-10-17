'use client';

import { createContext, startTransition, useActionState, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { idle, type ActionState, type FormAction } from '@/lib/action-state';
import { btn, btnSecondary } from './styles';

/* Forms post to server actions through useActionState (5.3). Errors and field errors show in place. */

const FormContext = createContext<{ state: ActionState; pending: boolean }>({ state: idle, pending: false });

export function useFormState() {
  return useContext(FormContext);
}

export function ActionForm({
  action,
  children,
  className = '',
  resetOnSuccess = false,
  showMessage = true,
  id,
  'aria-label': ariaLabel,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showMessage?: boolean;
  id?: string;
  'aria-label'?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) {
      ref.current?.reset();
      ref.current?.removeAttribute('data-dirty');
    }
  }, [state, resetOnSuccess]);

  // Submit manually so React doesn't reset the fields when the server returns an error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(event.currentTarget, submitter);
    event.currentTarget.removeAttribute('data-dirty');
    startTransition(() => formAction(data));
  }

  return (
    <FormContext.Provider value={{ state, pending }}>
      <form ref={ref} id={id} aria-label={ariaLabel} action={formAction} onSubmit={onSubmit} className={className} noValidate={false}>
        {children}
        {showMessage ? <FormMessage /> : null}
      </form>
    </FormContext.Provider>
  );
}

export function FormMessage() {
  const { state, pending } = useFormState();
  if (pending) return null;
  if (state.error) {
    return (
      <p role="alert" className="mt-3 rounded-lg bg-concern-soft px-3 py-2 text-sm text-concern">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="mt-3 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
        {state.message}
      </p>
    );
  }
  return null;
}

export function SubmitButton({
  children,
  pendingText,
  variant = 'primary',
  className = '',
  name,
  value,
  disabled,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormState();
  return (
    <button type="submit" name={name} value={value} disabled={pending || disabled} aria-disabled={pending || disabled} className={`${variant === 'primary' ? btn : btnSecondary} ${className}`}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** Label + control + hint + the field's server error. Pass the control as children with the same `id`. */
export function Field({
  label,
  name,
  hint,
  children,
  optional,
  htmlFor,
}: {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  children: ReactNode;
  optional?: boolean;
  htmlFor?: string;
}) {
  const { state } = useFormState();
  const error = state.fieldErrors?.[name];
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor ?? name} className="text-sm font-medium">
        {label}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
      </label>
      {children}
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-sm font-medium text-concern" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A server error for a field without a Field wrapper (radio groups, checklists). */
export function FieldError({ name }: { name: string }) {
  const { state } = useFormState();
  const error = state.fieldErrors?.[name];
  return error ? (
    <p className="text-sm font-medium text-concern" role="alert">
      {error}
    </p>
  ) : null;
}

/**
 * Two-step confirmation inside a form, never `window.confirm`: the first click shows what will happen,
 * the second submits.
 */
export function ConfirmSubmit({
  label,
  confirmLabel,
  children,
  cancelLabel = 'Keep it',
  name,
  value,
  variant = 'secondary',
}: {
  label: ReactNode;
  confirmLabel: ReactNode;
  children?: ReactNode;
  cancelLabel?: ReactNode;
  name?: string;
  value?: string;
  variant?: 'primary' | 'secondary';
}) {
  const [open, setOpen] = useState(false);
  const { pending } = useFormState();
  const id = useId();
  if (!open) {
    return (
      <button type="button" className={variant === 'primary' ? btn : btnSecondary} onClick={() => setOpen(true)} aria-controls={id}>
        {label}
      </button>
    );
  }
  return (
    <div id={id} className="flex flex-col gap-3 rounded-xl border border-line bg-soft p-4" role="group">
      {children ? <div className="text-sm">{children}</div> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" name={name} value={value} className={btn} disabled={pending}>
          {confirmLabel}
        </button>
        <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
