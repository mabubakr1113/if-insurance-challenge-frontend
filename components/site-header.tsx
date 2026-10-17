import Link from 'next/link';
import { actorLabel, currentPath, getMe, isPrintPath } from '@/lib/guards';
import { btn, btnSecondary, btnSmall } from './styles';

export async function SiteHeader() {
  if (isPrintPath(await currentPath())) return null;
  // The header never takes the page down: if the backend is unreachable the page itself says so.
  const me = await getMe().catch(() => null);
  const who = me ? actorLabel(me) : null;

  return (
    <header className="no-print border-b border-line bg-card/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight">
          If Home Watch
          <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-medium text-muted">Prototype</span>
        </Link>
        {me && who ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">
              Viewing as <span className="font-medium text-ink">{who.name}</span> · {who.role}
            </span>
            <Link href="/demo" className={`${btnSecondary} ${btnSmall}`}>
              Switch person
            </Link>
            <Link href="/notifications" className={`${btnSecondary} ${btnSmall}`}>
              Messages
              {me.unread > 0 ? (
                <span className="rounded-full bg-accent px-1.5 text-xs text-white">
                  {me.unread}
                  <span className="sr-only"> unread</span>
                </span>
              ) : null}
            </Link>
          </div>
        ) : (
          <Link href="/demo" className={`${btn} ${btnSmall}`}>
            Try the demo
          </Link>
        )}
      </div>
    </header>
  );
}
