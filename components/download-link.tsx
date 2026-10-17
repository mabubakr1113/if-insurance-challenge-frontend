'use client';

import type { ReactNode } from 'react';
import { toast } from './toaster';

/** A file download that confirms itself with a toast. */
export function DownloadLink({ href, className, children, message = 'Record downloaded.' }: { href: string; className: string; children: ReactNode; message?: string }) {
  return (
    <a href={href} download className={className} onClick={() => toast(message)}>
      {children}
    </a>
  );
}
