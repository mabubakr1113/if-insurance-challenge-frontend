/* eslint-disable @next/next/no-img-element -- signed URLs expire after 60 minutes and the seed uses SVGs (5.4) */
import type { Photo } from '@/lib/contract';
import { fmtDate } from '@/lib/format';

/** 4:3 thumbnails with 10px corners; each opens the full photo. */
export function PhotoGrid({ photos, captions = true }: { photos: Photo[]; captions?: boolean }) {
  if (!photos.length) return null;
  return (
    <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
      {photos.map((p) => (
        <li key={p.id} className="flex flex-col gap-1">
          <a href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[10px] bg-line-soft">
            <img src={p.url} alt={p.caption ?? `Photo by ${p.uploadedByLabel}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
          </a>
          {captions ? (
            <p className="text-xs text-muted">
              {p.caption ? <span className="text-ink">{p.caption} · </span> : null}
              {p.uploadedByLabel}, {fmtDate(p.createdAt)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
