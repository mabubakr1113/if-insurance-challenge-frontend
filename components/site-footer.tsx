import Link from 'next/link';
import { currentPath, isPrintPath } from '@/lib/guards';

export async function SiteFooter() {
  if (isPrintPath(await currentPath())) return null;
  return (
    <footer className="no-print mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <p className="max-w-2xl">
          Hackathon prototype for the If challenge “If Insurance Could Do More”, JunctionX Turku 2026. Fictional people, homes and partner.
          Messages and bookings are simulated. Not an If service.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/#how" className="underline underline-offset-4">
            How it works
          </Link>
          <Link href="/demo" className="underline underline-offset-4">
            Demo
          </Link>
        </nav>
      </div>
    </footer>
  );
}
