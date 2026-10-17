'use server';

import { apiForm, api, ApiError } from '@/lib/api';
import type { Photo } from '@/lib/contract';
import { UNREACHABLE_MESSAGE } from '@/lib/errors';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type PhotoResult = { ok: true; photo: Photo } | { ok: false; error: string };

function message(err: unknown): string {
  if (err instanceof ApiError) return err.code === 'backend_unreachable' ? UNREACHABLE_MESSAGE : err.message;
  console.error(err);
  return 'The photo could not be uploaded. Please try again.';
}

/** Uploads one (already downscaled) photo. Its id is sent later with the parent form's `photoIds`. */
export async function uploadPhoto(homeId: string, fd: FormData): Promise<PhotoResult> {
  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose a photo first.' };
  if (!TYPES.includes(file.type)) return { ok: false, error: 'Photos must be JPEG, PNG or WebP.' };
  if (file.size > MAX_BYTES) return { ok: false, error: 'Photos can be at most 5 MB.' };
  const form = new FormData();
  form.append('file', file, file.name);
  const caption = fd.get('caption');
  if (typeof caption === 'string' && caption.trim()) form.append('caption', caption.trim().slice(0, 200));
  try {
    return { ok: true, photo: await apiForm<Photo>(`/api/homes/${homeId}/photos`, form) };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

export async function deletePhoto(photoId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api<{ ok: true }>(`/api/photos/${photoId}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}
