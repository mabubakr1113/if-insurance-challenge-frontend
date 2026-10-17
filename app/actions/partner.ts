'use server';

import type { ActionState } from '@/lib/action-state';
import { act, invalid, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { Booking, PartnerReportBody, Visit } from '@/lib/contract';
import { fmtCount } from '@/lib/format';
import { readReport } from '@/lib/report-form';

export async function partnerAccept(bookingId: string): Promise<ActionState> {
  return act(() => api<Booking>(`/api/partner/jobs/${bookingId}/accept`, { method: 'POST' }), { message: 'Accepted. The family has been told.' });
}

export async function partnerDecline(bookingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const reason = text(fd, 'reason');
  if (!reason) return invalid({ reason: 'Give a short reason for the family' });
  return act(() => api<Booking>(`/api/partner/jobs/${bookingId}/decline`, { body: { reason } }), { message: 'Declined. The family has been told.' });
}

export async function partnerStart(bookingId: string): Promise<ActionState> {
  return act(() => api<Booking>(`/api/partner/jobs/${bookingId}/start`, { method: 'POST' }), { message: 'Visit started.' });
}

export async function partnerComplete(bookingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const report = readReport(fd);
  if (Object.keys(report.errors).length) return invalid(report.errors);
  const body: PartnerReportBody = { indoorTempC: report.indoorTempC, checks: report.checks, notes: report.notes, photoIds: report.photoIds };
  return act(() => api<Visit>(`/api/partner/jobs/${bookingId}/complete`, { body }), {
    message: (v) => `Report sent: ${v.okCount} OK, ${fmtCount(v.concernCount, 'concern')}${v.followUpTasks.length ? `, ${fmtCount(v.followUpTasks.length, 'follow-up')} for the family` : ''}.`,
  });
}
