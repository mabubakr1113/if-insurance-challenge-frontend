'use client';
/* eslint-disable @next/next/no-img-element -- signed, short-lived URLs (5.4) */

import { useId, useRef, useState, type ChangeEvent } from 'react';
import { deletePhoto, uploadPhoto } from '@/app/actions/photos';
import type { Photo } from '@/lib/contract';
import { downscale, MAX_UPLOAD_BYTES } from '@/lib/image';
import { Icon } from './icons';
import { control } from './styles';
import { Spinner } from './ui';

/**
 * Pick a photo (camera or library) → downscale in the browser → upload → keep its id (5.4).
 * The ids are submitted with the parent form as `photoIds`. Shown as dashed, rounded photo tiles.
 */
export function PhotoPicker({
  homeId,
  initial = [],
  canDelete = true,
  label = 'Photos',
  name = 'photoIds',
  showLabel = true,
}: {
  homeId: string;
  initial?: Photo[];
  canDelete?: boolean;
  label?: string;
  name?: string;
  showLabel?: boolean;
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
    <fieldset className="flex min-w-0 flex-col gap-2.5">
      <legend className={showLabel ? 'mb-2 text-sm font-semibold' : 'sr-only'}>
        {label} <span className="font-normal text-muted">(optional)</span>
      </legend>
      {photos.map((p) => (
        <input key={p.id} type="hidden" name={name} value={p.id} />
      ))}
      <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
        {photos.map((p) => (
          <li key={p.id} className="relative h-[110px] overflow-hidden rounded-[10px] bg-line-soft">
            <img src={p.url} alt={p.caption ?? `Photo by ${p.uploadedByLabel}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p)}
              className="absolute top-1.5 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-ink-strong/75 text-white hover:bg-ink-strong"
            >
              <Icon name="close" size={14} strokeWidth={2.2} />
              <span className="sr-only">Remove photo {p.caption ?? ''}</span>
            </button>
            {p.caption ? <span className="absolute inset-x-0 bottom-0 truncate bg-ink-strong/60 px-2 py-1 text-[11px] text-white">{p.caption}</span> : null}
          </li>
        ))}
        <li>
          <label
            className={`flex h-[110px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line-input bg-card text-[13px] font-semibold text-muted hover:border-line-hover hover:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
              busy ? 'pointer-events-none opacity-70' : ''
            }`}
          >
            {busy ? <Spinner tone="dark" /> : <Icon name="plus" size={18} strokeWidth={2} />}
            {busy ? 'Adding photo…' : 'Add a photo'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="sr-only" onChange={onFile} disabled={busy} />
          </label>
        </li>
      </ul>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-caption`} className="text-[13px] text-muted">
          Caption for the next photo (optional)
        </label>
        <input id={`${id}-caption`} value={caption} onChange={(e) => setCaption(e.target.value)} className={`${control} h-9`} maxLength={200} />
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-concern">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
