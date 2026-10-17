import type { Metadata } from 'next';
import Link from 'next/link';
import { RecordList } from '@/components/activity-list';
import { DownloadLink } from '@/components/download-link';
import { button } from '@/components/styles';
import { Card, Notice, PageHeader } from '@/components/ui';
import type { ActivityType, HomeRecord } from '@/lib/contract';
import { read, requireMember } from '@/lib/guards';

export const metadata: Metadata = { title: 'Home record' };

const KEY_EVENTS: ActivityType[] = [
  'visit_recorded',
  'task_completed',
  'weather_alert',
  'booking_requested',
  'booking_approved',
  'booking_confirmed',
  'booking_completed',
  'booking_cancelled',
  'booking_declined',
  'home_activated',
  'home_transition',
];

export default async function RecordPage({ params, searchParams }: PageProps<'/homes/[homeId]/record'>) {
  const { homeId } = await params;
  const { all } = await searchParams;
  await requireMember(homeId);
  const record = await read<HomeRecord>(`/api/homes/${homeId}/record`);
  const base = `/homes/${homeId}`;
  const everything = all === '1';
  const activity = [...record.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items = everything ? activity : activity.filter((a) => KEY_EVENTS.includes(a.type));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Home record"
        intro="A complete record of what was checked and done for this home."
        actions={
          <>
            <DownloadLink href={`${base}/record/download`} className={button('secondary')}>
              Download (JSON)
            </DownloadLink>
            <a href={`${base}/record/print`} className={button('primary')}>
              Print or save as PDF
            </a>
          </>
        }
      />

      <Notice tone="info" title="About this record.">
        {record.disclaimer}
      </Notice>

      <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]">
        <Card
          size="section"
          title={everything ? 'Everything, newest first' : 'Key events'}
          action={
            <Link href={everything ? `${base}/record` : `${base}/record?all=1`} scroll={false} className="text-[13px] font-semibold text-muted hover:text-ink">
              {everything ? 'Key events only' : 'Show everything'}
            </Link>
          }
          className="gap-1"
        >
          <RecordList items={items} homeId={homeId} />
        </Card>
      </div>
    </div>
  );
}
