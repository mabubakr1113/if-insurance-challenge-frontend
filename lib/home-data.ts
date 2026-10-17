import 'server-only';
import { cache } from 'react';
import type { HomeWeather, PlanResponse, TaskFilter, Visit, VisitSummary } from './contract';
import { read } from './guards';

/* Per-request cached reads used by several home pages. */

export const getPlan = cache((homeId: string, filter: TaskFilter = 'all') => read<PlanResponse>(`/api/homes/${homeId}/tasks?filter=${filter}`));
export const getWeather = cache((homeId: string) => read<HomeWeather>(`/api/homes/${homeId}/weather`));
export const getVisits = cache((homeId: string) => read<VisitSummary[]>(`/api/homes/${homeId}/visits`));

export interface FollowUpOrigin {
  visitId: string;
  visitorName: string;
  visitedAt: string;
}

/**
 * Which visit created each follow-up task. `Task` doesn't carry its source visit, so this reads the (few) recent
 * visits that reported concerns and maps their `followUpTasks` back.
 */
export const followUpOrigins = cache(async (homeId: string): Promise<Map<string, FollowUpOrigin>> => {
  const visits = (await getVisits(homeId)).filter((v) => v.concernCount > 0).slice(0, 10);
  const details = await Promise.all(visits.map((v) => read<Visit>(`/api/visits/${v.id}`)));
  const map = new Map<string, FollowUpOrigin>();
  for (const visit of details) {
    for (const task of visit.followUpTasks) map.set(task.id, { visitId: visit.id, visitorName: visit.visitorName, visitedAt: visit.visitedAt });
  }
  return map;
});
