'use server';

import type { ActionState } from '@/lib/action-state';
import { act, invalid, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { RecordVisitBody, Visit } from '@/lib/contract';
import { fromLocalInput } from '@/lib/format';
import { readReport } from '@/lib/report-form';

export async function recordVisit(homeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const report = readReport(fd);
  const errors = { ...report.errors };
  const visitedAt = fromLocalInput(text(fd, 'visitedAt'));
  if (!visitedAt) errors.visitedAt = 'Enter the date and time of the visit';
  else if (new Date(visitedAt).getTime() > Date.now() + 60 * 60 * 1000) errors.visitedAt = 'A visit can’t be more than an hour in the future';
  if (Object.keys(errors).length) return invalid(errors);

  const body: RecordVisitBody = {
    visitedAt: visitedAt as string,
    indoorTempC: report.indoorTempC,
    checks: report.checks,
    notes: report.notes,
    photoIds: report.photoIds,
  };
  return act(() => api<Visit>(`/api/homes/${homeId}/visits`, { body }), { redirect: (v) => `/homes/${homeId}/visits/${v.id}?new=1` });
}
