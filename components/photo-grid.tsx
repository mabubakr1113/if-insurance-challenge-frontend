/* eslint-disable @next/next/no-img-element -- signed URLs expire after 60 minutes and the seed uses SVGs (5.4) */
import type { Photo } from '@/lib/contract';
import { fmtDate } from '@/lib/format';

export function PhotoGrid({ photos, size = 'md' }: { photos: Photo[]; size?: 'sm' | 'md' }) {
  if (!photos.length) return null;
  return (
    <ul className={`grid gap-3 ${size === 'sm' ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {photos.map((p) => (
        <li key={p.id} className="flex flex-col gap-1">
          <a href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line bg-soft">
            <img src={p.url} alt={p.caption ?? `Photo by ${p.uploadedByLabel}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
          </a>
          {size === 'md' ? (
            <p className="text-xs text-muted">
              {p.caption ? <span className="text-ink">{p.caption}</span> : null}
              {p.caption ? ' · ' : ''}
              {p.uploadedByLabel}, {fmtDate(p.createdAt)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
