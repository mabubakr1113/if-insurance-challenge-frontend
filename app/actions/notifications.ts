'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { act, failure, refreshAll } from '@/lib/actions';
import { api } from '@/lib/api';
import { safeNext } from '@/lib/guards';

/** "Open": marks the message read, then follows its link. */
export async function openNotification(id: string, link: string): Promise<ActionState> {
  try {
    await api<{ ok: true }>('/api/notifications/read', { body: { ids: [id] } });
  } catch (err) {
    return failure(err);
  }
  refreshAll();
  redirect(safeNext(link) ?? '/notifications');
}

export async function markAllRead(): Promise<ActionState> {
  return act(() => api<{ ok: true }>('/api/notifications/read', { body: {} }), { message: 'All messages marked as read.' });
}
