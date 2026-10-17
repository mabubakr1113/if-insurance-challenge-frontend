'use client';

import { useEffect } from 'react';
import { button, type ButtonSize, type ButtonVariant } from './styles';

export function PrintButton({ label = 'Print', variant = 'secondary', size = 'md' }: { label?: string; variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button type="button" onClick={() => window.print()} className={`no-print ${button(variant, size)}`}>
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
