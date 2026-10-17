'use client';
/* eslint-disable @next/next/no-img-element -- signed, short-lived URLs (5.4) */

import { useId, useRef, useState, type ChangeEvent } from 'react';
import { deletePhoto, uploadPhoto } from '@/app/actions/photos';
import type { Photo } from '@/lib/contract';
import { downscale, MAX_UPLOAD_BYTES } from '@/lib/image';
import { btnSecondary, btnSmall, input } from './styles';

/**
 * Pick a photo (camera or library) → downscale in the browser → upload → keep its id (5.4).
 * The ids are submitted with the parent form as `photoIds`.
 */
export function PhotoPicker({
  homeId,
  initial = [],
  canDelete = true,
  label = 'Photos',
  name = 'photoIds',
}: {
  homeId: string;
  initial?: Photo[];
  canDelete?: boolean;
  label?: string;
  name?: string;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      if (!file.type.startsWith('image/')) throw new Error('Choose a photo (JPEG, PNG or WebP).');
      const small = await downscale(file);
      if (small.size > MAX_UPLOAD_BYTES) throw new Error('This photo is too large even after shrinking it. Try another one.');
      const fd = new FormData();
      fd.append('file', small);
      if (caption.trim()) fd.append('caption', caption.trim());
      const result = await uploadPhoto(homeId, fd);
      if (!result.ok) throw new Error(result.error);
      setPhotos((list) => [...list, result.photo]);
      setCaption('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The photo could not be added.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function remove(photo: Photo) {
    setError(null);
    if (canDelete) {
      const result = await deletePhoto(photo.id);
      if (!result.ok) {
        setError(result.error ?? 'The photo could not be removed.');
        return;
      }
    }
    setPhotos((list) => list.filter((p) => p.id !== photo.id));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">
        {label} <span className="font-normal text-muted">(optional)</span>
      </legend>
      {photos.map((p) => (
        <input key={p.id} type="hidden" name={name} value={p.id} />
      ))}
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="flex flex-col gap-1">
              <img src={p.url} alt={p.caption ?? `Photo by ${p.uploadedByLabel}`} className="aspect-[4/3] w-full rounded-lg border border-line object-cover" />
              {p.caption ? <span className="text-xs text-muted">{p.caption}</span> : null}
              <button type="button" onClick={() => remove(p)} className={`${btnSecondary} ${btnSmall}`}>
                Remove<span className="sr-only"> photo {p.caption ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`${id}-caption`} className="text-sm">
            Caption for the next photo <span className="text-muted">(optional)</span>
          </label>
          <input id={`${id}-caption`} value={caption} onChange={(e) => setCaption(e.target.value)} className={input} maxLength={200} />
        </div>
        <label className={`${btnSecondary} cursor-pointer has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? 'Adding photo…' : 'Add a photo'}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="sr-only" onChange={onFile} disabled={busy} />
        </label>
      </div>
      <p className="text-xs text-muted">Photos are made smaller on your device before upload. JPEG, PNG or WebP.</p>
      {error ? (
        <p role="alert" className="text-sm font-medium text-concern">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
