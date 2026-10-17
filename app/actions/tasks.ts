'use server';

import type { ActionState } from '@/lib/action-state';
import { act, all, invalid, nullable, oneOf, optional, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { Activity, CreateTaskBody, Task, TaskCategory, TaskPatch, TaskPriority } from '@/lib/contract';
import { fmtDate, fromLocalInput } from '@/lib/format';

const CATEGORIES: TaskCategory[] = ['water', 'heating', 'electricity', 'security', 'outside', 'admin', 'visit', 'appliances', 'other'];
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'normal'];

export async function createTask(homeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const errors: Record<string, string> = {};
  const title = text(fd, 'title');
  const category = oneOf(fd, 'category', CATEGORIES);
  const priority = oneOf(fd, 'priority', PRIORITIES) ?? 'normal';
  const due = text(fd, 'dueAt');
  const dueAt = due ? fromLocalInput(due) : null;
  if (!title) errors.title = 'Give the task a title';
  if (!category) errors.category = 'Choose a category';
  if (due && !dueAt) errors.dueAt = 'Enter a valid date and time';
  if (Object.keys(errors).length) return invalid(errors);
  const body: CreateTaskBody = {
    title,
    why: optional(fd, 'why'),
    category: category as TaskCategory,
    priority,
    dueAt,
    assigneeId: text(fd, 'assigneeId') || null,
  };
  return act(() => api<Task>(`/api/homes/${homeId}/tasks`, { body }), { redirect: (t) => `/homes/${homeId}/tasks/${t.id}` });
}

export async function acceptTask(taskId: string): Promise<ActionState> {
  return act(() => api<Task>(`/api/tasks/${taskId}/accept`, { method: 'POST' }), { message: 'You’re on it.' });
}

export async function declineTask(taskId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const reason = text(fd, 'reason');
  if (!reason) return invalid({ reason: 'Say briefly why, so the family can plan around it' });
  return act(() => api<Task>(`/api/tasks/${taskId}/decline`, { body: { reason } }), { message: 'Thanks for letting the family know.' });
}

export async function assignTask(taskId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const memberId = text(fd, 'memberId') || null;
  return act(() => api<Task>(`/api/tasks/${taskId}/assign`, { body: { memberId } }), {
    message: (t) => (t.assignee ? `Assigned to ${t.assignee.name}.` : 'Nobody is assigned now.'),
  });
}

export async function completeTask(taskId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const photoIds = all(fd, 'photoIds');
  return act(
    () => api<{ task: Task; nextTask: Task | null }>(`/api/tasks/${taskId}/complete`, { body: { note: optional(fd, 'note'), photoIds: photoIds.length ? photoIds : undefined } }),
    { message: (r) => (r.nextTask?.dueAt ? `Done. The next one is due ${fmtDate(r.nextTask.dueAt)}.` : 'Done.') },
  );
}

export async function reopenTask(taskId: string): Promise<ActionState> {
  return act(() => api<Task>(`/api/tasks/${taskId}/reopen`, { method: 'POST' }), { message: 'Reopened.' });
}

export async function commentOnTask(taskId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const body = text(fd, 'body');
  if (!body) return invalid({ body: 'Write a comment first' });
  return act(() => api<Activity>(`/api/tasks/${taskId}/comments`, { body: { body } }), { message: 'Comment added.' });
}

export async function editTask(taskId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const title = text(fd, 'title');
  const due = text(fd, 'dueAt');
  const dueAt = due ? fromLocalInput(due) : null;
  const errors: Record<string, string> = {};
  if (!title) errors.title = 'Give the task a title';
  if (due && !dueAt) errors.dueAt = 'Enter a valid date and time';
  if (Object.keys(errors).length) return invalid(errors);
  const body: TaskPatch = { title, why: nullable(fd, 'why'), priority: oneOf(fd, 'priority', PRIORITIES) ?? undefined, dueAt };
  return act(() => api<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body }), { message: 'Saved.' });
}

export async function cancelTask(taskId: string): Promise<ActionState> {
  return act(() => api<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body: { status: 'cancelled' } }), { message: 'Task cancelled.' });
}
