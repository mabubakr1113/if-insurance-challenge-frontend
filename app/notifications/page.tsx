import type { Metadata } from 'next';
import { markAllRead, openNotification } from '@/app/actions/notifications';
import { AutoRefresh } from '@/components/auto-refresh';
import { ActionForm, SubmitButton } from '@/components/forms';
import { btnSmall } from '@/components/styles';
import { Badge, Empty, PageHeader, SimLabel } from '@/components/ui';
import type { NotificationsResponse } from '@/lib/contract';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { read, requireActor } from '@/lib/guards';
import { CHANNEL } from '@/lib/labels';

export const metadata: Metadata = { title: 'Messages' };

export default async function NotificationsPage() {
  await requireActor();
  const data = await read<NotificationsResponse>('/api/notifications');

  return (
    <div className="mx-auto max-w-3xl">
      <AutoRefresh seconds={15} />
      <PageHeader title="Messages" intro={data.unread ? `${data.unread} unread` : undefined}>
        {data.unread ? (
          <ActionForm action={markAllRead}>
            <SubmitButton variant="secondary" pendingText="Marking…">
              Mark all as read
            </SubmitButton>
          </ActionForm>
        ) : null}
      </PageHeader>
      {data.items.length === 0 ? (
        <Empty>No messages yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((n) => {
            const unread = !n.readAt;
            return (
              <li key={n.id} className={`rounded-xl border p-4 ${unread ? 'border-accent/40 bg-card shadow-xs' : 'border-line bg-card/60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    {n.channel === 'in_app' ? <Badge>{CHANNEL.in_app}</Badge> : <SimLabel>{CHANNEL[n.channel]}</SimLabel>}
                    {unread ? <Badge tone="accent">Unread</Badge> : null}
                  </span>
                  <time dateTime={n.createdAt} title={fmtDateTime(n.createdAt)} className="text-sm text-muted">
                    {fmtRelative(n.createdAt)}
                  </time>
                </div>
                <p className={`mt-2 ${unread ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                {n.body ? <p className="mt-1 text-sm">{n.body}</p> : null}
                {n.link ? (
                  <ActionForm action={openNotification.bind(null, n.id, n.link)} className="mt-3">
                    <SubmitButton variant="secondary" className={btnSmall} pendingText="Opening…">
                      Open
                    </SubmitButton>
                  </ActionForm>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
