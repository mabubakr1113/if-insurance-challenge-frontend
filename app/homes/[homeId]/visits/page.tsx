import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { SupervisionStrip } from '@/components/supervision';
import { ButtonLink, Empty, initials, PageHeader } from '@/components/ui';
import { fmtCount, fmtDateTime, fmtTemp } from '@/lib/format';
import { canHelp, getDashboard, isClosed, requireMember } from '@/lib/guards';
import { getVisits } from '@/lib/home-data';

export const metadata: Metadata = { title: 'Visits' };

export default async function VisitsPage({ params }: PageProps<'/homes/[homeId]/visits'>) {
  const { homeId } = await params;
  await requireMember(homeId);
  const [visits, d] = await Promise.all([getVisits(homeId), getDashboard(homeId)]);
  const helper = canHelp(d.me) && !isClosed(d.home);
  const base = `/homes/${homeId}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visits"
        intro="Every visit to the house, by the family or a local partner."
        actions={
          helper ? (
            <ButtonLink href={`${base}/visits/new`} icon="plus">
              Record a visit
            </ButtonLink>
          ) : null
        }
      />
      <SupervisionStrip supervision={d.supervision} />
      {visits.length === 0 ? (
        <Empty
          tall
          title="No visits recorded yet"
          action={helper ? <ButtonLink href={`${base}/visits/new`}>Record the first visit</ButtonLink> : null}
        >
          The first visit matters most: it finds the valves and checks the heating.
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visits.map((v) => {
            const partner = v.visitorType === 'partner';
            const summary = [
              v.indoorTempC !== null ? `${fmtTemp(v.indoorTempC)} inside` : null,
              `${v.okCount} OK`,
              fmtCount(v.concernCount, 'concern'),
              v.photoCount ? fmtCount(v.photoCount, 'photo') : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={v.id}>
                <Link
                  href={`${base}/visits/${v.id}`}
                  className="flex flex-wrap items-center gap-4 rounded-[14px] border border-line bg-card px-5 py-[18px] text-ink hover:border-line-hover"
                >
                  <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold ${partner ? 'bg-accent-soft' : 'bg-chip'}`}>
                    {initials(v.visitorName)}
                  </span>
                  <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                    <span className="text-base font-semibold">{fmtDateTime(v.visitedAt)}</span>
                    <span className="text-[13px] text-muted">
                      {v.visitorName} · {partner ? 'Local partner visit' : 'Family visit'}
                    </span>
                  </span>
                  <span className={`text-sm ${v.concernCount ? 'text-concern' : 'text-muted'}`}>{summary}</span>
                  <Icon name="next" size={16} strokeWidth={2} color="var(--color-muted)" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
