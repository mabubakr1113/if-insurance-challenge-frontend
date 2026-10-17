import type { Metadata } from 'next';
import { joinFamily } from '@/app/actions/invites';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Card, PageHeader } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { JoinView } from '@/lib/contract';
import { ROLE, ROLE_MEANING } from '@/lib/labels';

export const metadata: Metadata = { title: 'Join the family' };

export default async function JoinPage({ params }: PageProps<'/join/[token]'>) {
  const { token } = await params;
  let view: JoinView;
  try {
    view = await api<JoinView>(`/api/join/${encodeURIComponent(token)}`, { actor: null });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.code === 'removed')) {
      return (
        <div className="mx-auto max-w-xl py-12 text-center">
          <h1 className="text-2xl font-semibold">{err.code === 'removed' ? 'This invitation is no longer active.' : 'This invitation link isn’t valid.'}</h1>
        </div>
      );
    }
    throw err;
  }

  const { member, home } = view;
  const whose = home.estateName ? `${home.estateName}’s home` : 'the home';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Join the family"
        intro={`${view.invitedBy ?? 'Your family'} invited you to help look after ${whose} at ${home.addressLine}, ${home.city}.`}
      />
      <Card>
        <p>
          <span className="font-medium">Your role: {ROLE[member.role]}</span>. You {ROLE_MEANING[member.role]}.
        </p>
        {member.canAuthorise ? <p className="mt-2">You can approve local visits.</p> : null}
        <p className="mt-2 text-muted">Helpers take tasks, record visits and add house notes.</p>
        <p className="mt-2 text-sm text-muted">Only people the family invites can see this home. The plan can be closed at any time.</p>
        <ActionForm action={joinFamily.bind(null, token)} className="mt-5">
          <SubmitButton pendingText="Joining…">{member.status === 'joined' ? `Continue as ${member.name}` : 'Join'}</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
