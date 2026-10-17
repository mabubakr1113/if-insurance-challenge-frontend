import type { Metadata } from 'next';
import Link from 'next/link';
import { link } from '@/components/styles';
import { SupervisionSummary } from '@/components/supervision';
import { Badge, ButtonLink, Card, Empty, PageHeader } from '@/components/ui';
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
      <PageHeader title="Visits">{helper ? <ButtonLink href={`${base}/visits/new`}>Record a visit</ButtonLink> : null}</PageHeader>
      <Card title="Supervision">
        <SupervisionSummary supervision={d.supervision} />
      </Card>
      {visits.length === 0 ? (
        <Empty>No visits recorded yet. The first visit matters most: it finds the valves and checks the heating.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {visits.map((v) => (
            <li key={v.id}>
              <Card as="article">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`${base}/visits/${v.id}`} className={`${link} font-semibold`}>
                      {fmtDateTime(v.visitedAt)}
                    </Link>
                    <p className="text-sm text-muted">
                      {v.visitorName}
                      {v.visitorType === 'partner' ? ' · Local partner visit' : ''}
                    </p>
                  </div>
                  {v.visitorType === 'partner' ? <Badge tone="accent">Local partner visit</Badge> : null}
                </div>
                <p className="mt-2 text-sm">
                  {v.indoorTempC !== null ? `${fmtTemp(v.indoorTempC)} inside · ` : ''}
                  {v.okCount} OK · <span className={v.concernCount ? 'font-medium text-concern' : ''}>{fmtCount(v.concernCount, 'concern')}</span>
                  {v.photoCount ? ` · ${fmtCount(v.photoCount, 'photo')}` : ''}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
