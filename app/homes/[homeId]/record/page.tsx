import type { Metadata } from 'next';
import { ActivityList } from '@/components/activity-list';
import { RecordSummary } from '@/components/record-summary';
import { btn, btnSecondary } from '@/components/styles';
import { Card, Notice, PageHeader } from '@/components/ui';
import type { ActivityType, HomeRecord } from '@/lib/contract';
import { read, requireMember } from '@/lib/guards';
import { RELATION, ROLE } from '@/lib/labels';

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
];

export default async function RecordPage({ params }: PageProps<'/homes/[homeId]/record'>) {
  const { homeId } = await params;
  await requireMember(homeId);
  const record = await read<HomeRecord>(`/api/homes/${homeId}/record`);
  const base = `/homes/${homeId}`;
  const activity = [...record.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const keyEvents = activity.filter((a) => KEY_EVENTS.includes(a.type));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Home record" intro="A complete record of what was checked and done for this home.">
        <a href={`${base}/record/download`} className={btnSecondary} download>
          Download (JSON)
        </a>
        <a href={`${base}/record/print`} className={btn}>
          Print or save as PDF
        </a>
      </PageHeader>

      <Notice tone="accent" title="About this record">
        {record.disclaimer}
      </Notice>

      <Card title="Summary">
        <RecordSummary record={record} />
      </Card>

      <Card title="Key events">
        <p className="-mt-1 mb-2 text-sm text-muted">Visits, completed tasks, local visits and weather alerts.</p>
        <ActivityList items={keyEvents} homeId={homeId} absolute />
      </Card>

      <Card title="Everything, newest first">
        <ActivityList items={activity} homeId={homeId} absolute />
      </Card>

      <Card title="Family members">
        <ul className="flex flex-col gap-1">
          {record.members.map((m) => (
            <li key={m.id}>
              {m.name} · {ROLE[m.role]} · {RELATION[m.relation]}
              {m.canAuthorise ? ' · can approve visits' : ''}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
