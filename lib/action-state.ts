/* What a server action returns to its form (5.3). Shared by actions and client forms. */

export interface ActionState {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Changes on every result, so forms can react to a repeated identical result. */
  at?: number;
  data?: Record<string, unknown>;
}

export const idle: ActionState = { ok: false };

export type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;
