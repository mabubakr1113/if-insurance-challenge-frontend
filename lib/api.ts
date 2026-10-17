import 'server-only';
import { getActor } from './actor';
import type { ActorHeader } from './contract';
import { ApiError } from './errors';

export { ApiError } from './errors';

/* Server-only client for the backend API (5.1). The API key never leaves the server. */

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface ApiOptions {
  method?: Method;
  body?: unknown;
  /** Defaults to the demo cookie. `null` sends no X-Actor header. */
  actor?: ActorHeader | null;
}

function config(): { url: string; key: string } {
  const url = process.env.BACKEND_URL;
  const key = process.env.BACKEND_API_KEY;
  const missing = [!url && 'BACKEND_URL', !key && 'BACKEND_API_KEY'].filter(Boolean);
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')}. Copy .env.example to .env.local and set ${missing.length > 1 ? 'them' : 'it'}.`);
  }
  return { url: (url as string).replace(/\/+$/, ''), key: key as string };
}

async function toError(res: Response): Promise<ApiError> {
  try {
    const json = (await res.json()) as { error?: { code?: string; message?: string; details?: unknown } };
    if (json.error?.code) return new ApiError(res.status, json.error.code, json.error.message ?? res.statusText, json.error.details);
  } catch {
    // not JSON: fall through
  }
  return new ApiError(res.status, res.status === 404 ? 'not_found' : 'http_error', res.statusText || `HTTP ${res.status}`);
}

/** Sends a request and returns the raw response; throws ApiError on a non-2xx status or a network failure. */
export async function apiRaw(path: string, init: { method?: Method; body?: BodyInit; json?: boolean; actor?: ActorHeader | null } = {}): Promise<Response> {
  const { url, key } = config();
  const actor = init.actor === undefined ? await getActor() : init.actor;
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (actor) headers['X-Actor'] = actor;
  if (init.json) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${url}${path}`, { method: init.method ?? 'GET', headers, body: init.body, cache: 'no-store' });
  } catch {
    throw new ApiError(503, 'backend_unreachable', "The Home Watch service isn't responding");
  }
  if (!res.ok) throw await toError(res);
  return res;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const hasBody = opts.body !== undefined;
  const res = await apiRaw(path, {
    method: opts.method ?? (hasBody ? 'POST' : 'GET'),
    body: hasBody ? JSON.stringify(opts.body) : undefined,
    json: hasBody,
    actor: opts.actor,
  });
  return (await res.json()) as T;
}

/** Multipart upload (photos). */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const res = await apiRaw(path, { method: 'POST', body: form });
  return (await res.json()) as T;
}
