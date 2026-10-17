import { HomeNav } from '@/components/home-nav';
import { Notice } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { currentPath, getDashboard, isClosed, isPrintPath, requireMember } from '@/lib/guards';
import { homeStatusText, ROLE, whoseHome } from '@/lib/labels';

/** P6: the home shell around every /homes/[homeId]/* page. */
export default async function HomeLayout({ children, params }: LayoutProps<'/homes/[homeId]'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  if (isPrintPath(await currentPath())) return children;

  const dashboard = await getDashboard(homeId);
  const { home } = dashboard;
  const base = `/homes/${homeId}`;
  const items = [
    { href: base, label: 'Overview' },
    { href: `${base}/plan`, label: 'Plan', badge: dashboard.counts.needsOwner, badgeLabel: 'need an owner' },
    { href: `${base}/visits`, label: 'Visits' },
    { href: `${base}/notes`, label: 'House notes', badge: dashboard.essentialsMissing.length, badgeLabel: 'essentials missing' },
    { href: `${base}/weather`, label: 'Weather' },
    { href: `${base}/help`, label: 'Local visit' },
    { href: `${base}/family`, label: 'Family' },
    { href: `${base}/record`, label: 'Record' },
    { href: `${base}/settings`, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{whoseHome(home.estateName)}</p>
            <p className="text-muted">
              {home.addressLine}, {home.postalCode} {home.city} · <span className="text-ink">{homeStatusText(home)}</span>
            </p>
          </div>
          <p className="text-sm text-muted">
            Viewing as {me.member.name} · {ROLE[me.member.role]}
          </p>
        </div>
        <HomeNav items={items} />
      </div>
      {isClosed(home) ? (
        <Notice tone="neutral" role="status">
          This plan was closed{home.closedAt ? ` on ${fmtDate(home.closedAt)}` : ''}
          {home.closeReason ? ` (${home.closeReason})` : ''}. Everything stays readable, and you can still download the record.
        </Notice>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
