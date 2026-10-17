'use client';

import { useId, useState, type ReactNode } from 'react';
import { Icon } from './icons';
import { eyebrow } from './styles';

/** "HOW TO DO IT · 3 STEPS ▾": collapsed by default. */
export function Disclosure({ label, children, defaultOpen = false }: { label: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="flex flex-col gap-2.5">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={`flex cursor-pointer items-center gap-2 self-start ${eyebrow} hover:text-ink`}>
        {label}
        <Icon name="down" size={14} strokeWidth={2} className={open ? "rotate-180" : ""} />
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
