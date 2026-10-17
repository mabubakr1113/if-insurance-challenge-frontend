'use client';

import {
  createContext,
  startTransition,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { idle, type ActionState, type FormAction } from '@/lib/action-state';
import { Dialog, DialogActions, DialogCancel, useDialog } from './dialog';
import { Icon, type IconName } from './icons';
import { button, fieldError, hint as hintClass, label as labelClass, type ButtonSize, type ButtonVariant } from './styles';
import { toast } from './toaster';
import { Spinner } from './ui';

/*
 * Forms post to server actions through useActionState (5.3). A success message becomes a toast; field errors
 * show under their field (red border, 13px concern text) after submit, never while typing.
 */

interface FormCtx {
  state: ActionState;
  pending: boolean;
  formId?: string;
  /** Names of the fields that show their own error. */
  fields: string[];
  register: (name: string) => () => void;
}

const FormContext = createContext<FormCtx>({ state: idle, pending: false, fields: [], register: () => () => {} });

export function useFormState() {
  return useContext(FormContext);
}

export function ActionForm({
  action,
  children,
  className = '',
  resetOnSuccess = false,
  showMessage = true,
  toastOnSuccess = true,
  id,
  'aria-label': ariaLabel,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showMessage?: boolean;
  toastOnSuccess?: boolean;
  id?: string;
  'aria-label'?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  const ref = useRef<HTMLFormElement>(null);
  const dialog = useDialog();
  const autoId = useId();
  const formId = id ?? autoId;
  const [fields, setFields] = useState<string[]>([]);

  const register = useCallback((name: string) => {
    setFields((list) => (list.includes(name) ? list : [...list, name]));
    return () => setFields((list) => list.filter((n) => n !== name));
  }, []);

  useEffect(() => {
    if (!state.ok || !state.at) return;
    if (toastOnSuccess && state.message) toast(state.message);
    if (resetOnSuccess) {
      ref.current?.reset();
      ref.current?.removeAttribute('data-dirty');
    }
    dialog?.close();
    // Only react to a new result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.at]);

  // Submit manually so React doesn't reset the fields when the server returns an error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(event.currentTarget, submitter);
    event.currentTarget.removeAttribute('data-dirty');
    startTransition(() => formAction(data));
  }

  return (
    <FormContext.Provider value={{ state, pending, formId, fields, register }}>
      <form ref={ref} id={formId} aria-label={ariaLabel} action={formAction} onSubmit={onSubmit} className={className} noValidate>
        {children}
        {showMessage ? <FormMessage /> : null}
      </form>
    </FormContext.Provider>
  );
}

/** A form-level error, shown when the problem isn't already shown beside a field. */
export function FormMessage({ className = 'mt-3' }: { className?: string }) {
  const { state, pending, fields } = useFormState();
  if (pending || state.ok || !state.error) return null;
  const errorKeys = Object.keys(state.fieldErrors ?? {});
  if (errorKeys.length && errorKeys.every((k) => fields.includes(k))) return null;
  return (
    <p role="alert" className={`rounded-xl bg-concern-soft px-4 py-3 text-sm text-concern ${className}`}>
      {state.error}
    </p>
  );
}

function spinnerTone(variant: ButtonVariant): 'light' | 'dark' | 'sim' {
  if (variant === 'primary' || variant === 'danger') return 'light';
  return variant === 'sim' ? 'sim' : 'dark';
}

/** Shows a spinner while pending and ignores repeat clicks. */
export function SubmitButton({
  children,
  pendingText,
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  className = '',
  name,
  value,
  disabled,
  'aria-pressed': ariaPressed,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: IconName;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  'aria-pressed'?: boolean;
  'aria-label'?: string;
}) {
  const { pending, formId } = useFormState();
  const [mine, setMine] = useState(false);
  // Forget which button was clicked once the submission finishes.
  const [wasPending, setWasPending] = useState(pending);
  if (wasPending !== pending) {
    setWasPending(pending);
    if (!pending) setMine(false);
  }
  // With several submit buttons in one form, only the one that was clicked spins.
  const busy = pending && (mine || !name);
  return (
    <button
      type="submit"
      form={formId}
      name={name}
      value={value}
      disabled={disabled}
      aria-disabled={pending || disabled ? true : undefined}
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (pending) {
          e.preventDefault();
          return;
        }
        setMine(true);
      }}
      className={button(variant, size, `${block ? 'w-full' : ''} ${className}`)}
    >
      {busy ? <Spinner tone={spinnerTone(variant)} size={size === 'sm' || size === 'xs' ? 12 : 14} /> : icon ? <Icon name={icon} size={16} strokeWidth={2} /> : null}
      {busy && pendingText ? pendingText : children}
    </button>
  );
}

function useRegister(name: string) {
  const { register } = useFormState();
  useEffect(() => register(name), [register, name]);
}

/** Label + control + hint + the field's error. Pass the control as children with `id` = `htmlFor ?? name`. */
export function Field({
  label,
  name,
  hint,
  children,
  optional,
  htmlFor,
  className = '',
}: {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  children: ReactNode;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  const { state } = useFormState();
  useRegister(name);
  const error = state.fieldErrors?.[name];
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`} data-invalid={error ? 'true' : undefined}>
      <label htmlFor={htmlFor ?? name} className={labelClass}>
        {label}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
      </label>
      {hint ? <p className={`-mt-0.5 ${hintClass}`}>{hint}</p> : null}
      {children}
      {error ? (
        <p className={fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** An error for a field without a Field wrapper (chips, radio tiles, checklists). */
export function FieldError({ name, className = '' }: { name: string; className?: string }) {
  const { state } = useFormState();
  useRegister(name);
  const error = state.fieldErrors?.[name];
  return error ? (
    <p className={`${fieldError} ${className}`} role="alert">
      {error}
    </p>
  ) : null;
}

/** Marks a wrapper invalid (red borders inside) when its field has an error. */
export function InvalidWrap({ name, children, className = '' }: { name: string; children: ReactNode; className?: string }) {
  const { state } = useFormState();
  return (
    <div className={className} data-invalid={state.fieldErrors?.[name] ? 'true' : undefined}>
      {children}
    </div>
  );
}

/**
 * Confirmation inside a form, never `window.confirm`: the trigger opens an alert dialog that says what will
 * happen; its button submits the surrounding form.
 */
export function ConfirmSubmit({
  label,
  title,
  confirmLabel,
  children,
  cancelLabel = 'Keep it',
  name,
  value,
  pendingText,
  triggerVariant = 'secondary',
  triggerSize = 'md',
  triggerClassName,
  confirmVariant = 'danger',
}: {
  label: ReactNode;
  title: ReactNode;
  confirmLabel: ReactNode;
  children?: ReactNode;
  cancelLabel?: ReactNode;
  name?: string;
  value?: string;
  pendingText?: string;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  /** Replaces the button styling of the trigger (e.g. a menu item). */
  triggerClassName?: string;
  confirmVariant?: ButtonVariant;
}) {
  return (
    <Dialog
      title={title}
      trigger={label}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      triggerClassName={triggerClassName}
      unstyledTrigger={!!triggerClassName}
      role="alertdialog"
      width="sm"
    >
      <CloseOnSuccess />
      {children ? <div className="text-[15px] leading-[1.55] text-ink-soft">{children}</div> : null}
      <FormMessage className="" />
      <DialogActions>
        <DialogCancel>{cancelLabel}</DialogCancel>
        <SubmitButton name={name} value={value} variant={confirmVariant} pendingText={pendingText}>
          {confirmLabel}
        </SubmitButton>
      </DialogActions>
    </Dialog>
  );
}

function CloseOnSuccess() {
  const { state } = useFormState();
  const dialog = useDialog();
  useEffect(() => {
    if (state.ok && state.at) dialog?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.at]);
  return null;
}

/** A select that saves as soon as it changes (e.g. the task owner). */
export function AutoSubmitSelect({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { pending } = useFormState();
  return (
    <select
      {...props}
      disabled={pending || props.disabled}
      className={className}
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    >
      {children}
    </select>
  );
}
