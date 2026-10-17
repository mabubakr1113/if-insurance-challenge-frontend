'use client';

import { useEffect } from 'react';
import { btn, btnSecondary } from './styles';

export function PrintButton({ label = 'Print', variant = 'secondary' }: { label?: string; variant?: 'primary' | 'secondary' }) {
  return (
    <button type="button" onClick={() => window.print()} className={`no-print ${variant === 'primary' ? btn : btnSecondary}`}>
      {label}
    </button>
  );
}

/** Opens the print dialog once the page has loaded (P20 print view). */
export function AutoPrint() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
