/* Shared by server code and the client error boundary. */

/** Digest set on "backend unreachable" errors so `error.tsx` can recognise them in production too. */
export const BACKEND_UNREACHABLE = 'hw-backend-unreachable';

export const UNREACHABLE_MESSAGE =
  "The Home Watch service isn't responding. If you're running locally, start the backend on port 3001.";

export class ApiError extends Error {
  digest?: string;

  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    if (code === 'backend_unreachable') this.digest = BACKEND_UNREACHABLE;
  }
}

/** Zod issues from a backend `400` → `{ "field.path": "message" }` (first message per field). */
export function fieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(details)) return out;
  for (const issue of details) {
    if (!issue || typeof issue !== 'object') continue;
    const { path, message } = issue as { path?: unknown; message?: unknown };
    const key = Array.isArray(path) && path.length ? path.join('.') : '_form';
    if (typeof message === 'string' && !out[key]) out[key] = message;
  }
  return out;
}
