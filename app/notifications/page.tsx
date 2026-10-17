import type { Metadata } from 'next';
import { markAllRead, openNotification } from '@/app/actions/notifications';
import { AutoRefresh } from '@/components/auto-refresh';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Badge, PageHeader } from '@/components/ui';
import type { NotificationsResponse } from '@/lib/contract';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { read, requireActor } from '@/lib/guards';

export const metadata: Metadata = { title: 'Messages' };

const CHANNEL_LABEL = { in_app: 'In app', sms: 'SMS · simulated', email: 'Email · simulated' } as const;

export default async function NotificationsPage() {
  await requireActor();
  const data = await read<NotificationsResponse>('/api/notifications');

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <AutoRefresh seconds={10} />
      <PageHeader
        title="Messages"
        intro={data.unread ? `${data.unread} unread` : 'All caught up'}
        actions={
          data.unread ? (
            <ActionForm action={markAllRead}>
              <SubmitButton variant="secondary" pendingText="Marking…">
                Mark all as read
              </SubmitButton>
            </ActionForm>
          ) : null
        }
      />
      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-input px-6 py-12 text-center text-[15px] text-muted">
          No messages yet. Alerts, visit reports and comments arrive here.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((n) => {
            const unread = !n.readAt;
            return (
              <li key={n.id}>
                {/* The whole card opens the message's link and marks it read. */}
                <ActionForm action={openNotification.bind(null, n.id, n.link ?? '/notifications')}>
                  <button
                    type="submit"
                    className={`flex w-full cursor-pointer items-start gap-3.5 rounded-[14px] border px-5 py-[18px] text-left text-ink hover:border-line-hover ${
                      unread ? 'border-unread-line bg-white' : 'border-line bg-card'
                    }`}
                  >
                    <span aria-hidden="true" className={`mt-[7px] size-2 shrink-0 rounded-full ${unread ? 'bg-accent' : 'bg-transparent'}`} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                        <span className={`text-[15px] ${unread ? 'font-bold' : 'font-medium'}`}>
                          {unread ? <span className="sr-only">Unread: </span> : null}
                          {n.title}
                        </span>
                        <time dateTime={n.createdAt} title={fmtDateTime(n.createdAt)} className="text-xs text-muted">
                          {fmtRelative(n.createdAt)}
                        </time>
                      </span>
                      {n.body ? <span className="text-sm leading-normal text-ink-soft">{n.body}</span> : null}
                      <span className="self-start">
                        <Badge tone={n.channel === 'in_app' ? 'category' : 'attention'}>{CHANNEL_LABEL[n.channel]}</Badge>
                      </span>
                    </span>
                  </button>
                </ActionForm>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
