'use server';

import type { ActionState } from '@/lib/action-state';
import { act, checked, invalid, nullable, number, oneOf, optional, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { BuildingType, HeatingType, Home, HomeSetupPatch, TransitionBody, TransitionStatus, WaterSource, YesNoUnknown } from '@/lib/contract';

const BUILDINGS: BuildingType[] = ['detached', 'semi_detached', 'terraced', 'cottage', 'other'];
const HEATING: HeatingType[] = ['district', 'electric', 'oil', 'ground_heat_pump', 'air_heat_pump', 'wood', 'unknown'];
const WATER: WaterSource[] = ['municipal', 'well', 'unknown'];
const YES_NO: YesNoUnknown[] = ['yes', 'no', 'unknown'];
const TRANSITIONS: TransitionStatus[] = ['occupied', 'sold', 'transferred', 'closed'];
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** P21: coordinators edit the setup answers. Existing tasks don't change. */
export async function saveHomeSettings(homeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const errors: Record<string, string> = {};
  const vacantSince = nullable(fd, 'vacantSince');
  const lastKnownVisit = nullable(fd, 'lastKnownVisit');
  if (vacantSince && !YMD.test(vacantSince)) errors.vacantSince = 'Use the format YYYY-MM-DD';
  if (lastKnownVisit && !YMD.test(lastKnownVisit)) errors.lastKnownVisit = 'Use the format YYYY-MM-DD';
  const year = number(fd, 'yearBuilt');
  if (year !== null && (!Number.isInteger(year) || year < 1700 || year > 2100)) errors.yearBuilt = 'Enter a year between 1700 and 2100';
  if (Object.keys(errors).length) return invalid(errors);

  const body: HomeSetupPatch = {
    vacantSince,
    lastKnownVisit,
    buildingType: oneOf(fd, 'buildingType', BUILDINGS),
    yearBuilt: year,
    keyHolder: nullable(fd, 'keyHolder'),
    accessNotes: nullable(fd, 'accessNotes'),
    heatingType: oneOf(fd, 'heatingType', HEATING),
    heatingOn: oneOf(fd, 'heatingOn', YES_NO),
    waterSource: oneOf(fd, 'waterSource', WATER),
    waterMainClosed: oneOf(fd, 'waterMainClosed', YES_NO),
    hasAlarm: oneOf(fd, 'hasAlarm', YES_NO),
  };
  return act(() => api<Home>(`/api/homes/${homeId}`, { method: 'PATCH', body }), { message: 'Saved. Existing tasks are unchanged.' });
}

/** P21: what happens to the home next. Closes the plan; everything stays readable. */
export async function transitionHome(homeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const status = oneOf(fd, 'status', TRANSITIONS);
  if (!status) return invalid({ status: 'Choose what has happened to the home.' });
  const body: TransitionBody = {
    status,
    note: optional(fd, 'note'),
    newOwnerWantsCoverHelp: status === 'sold' || status === 'transferred' ? checked(fd, 'newOwnerWantsCoverHelp') : undefined,
  };
  if (text(fd, 'note').length > 2000) return invalid({ note: 'Keep the note under 2000 characters' });
  return act(() => api<Home>(`/api/homes/${homeId}/transition`, { body }), { redirect: () => `/homes/${homeId}?closed=1` });
}
