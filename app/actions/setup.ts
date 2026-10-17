'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { failure, invalid, nullable, number, oneOf, refreshAll, text } from '@/lib/actions';
import { api, ApiError } from '@/lib/api';
import type { BuildingType, HeatingType, Home, HomeSetupPatch, Member, Task, WaterSource, YesNoUnknown } from '@/lib/contract';

const BUILDINGS: BuildingType[] = ['detached', 'semi_detached', 'terraced', 'cottage', 'other'];
const HEATING: HeatingType[] = ['district', 'electric', 'oil', 'ground_heat_pump', 'air_heat_pump', 'wood', 'unknown'];
const WATER: WaterSource[] = ['municipal', 'well', 'unknown'];
const YES_NO: YesNoUnknown[] = ['yes', 'no', 'unknown'];
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function date(fd: FormData, name: string, errors: Record<string, string>): string | null {
  const v = text(fd, name);
  if (!v) return null;
  if (!YMD.test(v)) errors[name] = 'Use the format YYYY-MM-DD';
  return v;
}

/** Saves one setup step (PATCH) and moves to the next. Leaving and coming back keeps the answers. */
export async function saveSetupStep(homeId: string, step: number, memberId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const errors: Record<string, string> = {};
  let patch: HomeSetupPatch = {};
  let canAuthorise: boolean | undefined;

  if (step === 1) {
    if (text(fd, 'occupancy') !== 'empty') return invalid({ occupancy: 'Choose whether anyone lives in the home' });
    const year = number(fd, 'yearBuilt');
    if (year !== null && (!Number.isInteger(year) || year < 1700 || year > 2100)) errors.yearBuilt = 'Enter a year between 1700 and 2100';
    patch = {
      occupancyConfirmed: true,
      vacantSince: date(fd, 'vacantSince', errors),
      lastKnownVisit: date(fd, 'lastKnownVisit', errors),
      buildingType: oneOf(fd, 'buildingType', BUILDINGS),
      yearBuilt: year === null || Number.isNaN(year) ? null : year,
    };
  } else if (step === 2) {
    const authority = text(fd, 'authority');
    patch = { authorityConfirmed: authority === 'yes' || authority === 'other', keyHolder: nullable(fd, 'keyHolder'), accessNotes: nullable(fd, 'accessNotes') };
    if (authority === 'yes') canAuthorise = true;
    if (authority === 'other') canAuthorise = false;
  } else if (step === 3) {
    patch = {
      heatingType: oneOf(fd, 'heatingType', HEATING),
      heatingOn: oneOf(fd, 'heatingOn', YES_NO),
      waterSource: oneOf(fd, 'waterSource', WATER),
      waterMainClosed: oneOf(fd, 'waterMainClosed', YES_NO),
      hasAlarm: oneOf(fd, 'hasAlarm', YES_NO),
    };
  }
  if (Object.keys(errors).length) return invalid(errors);

  try {
    if (Object.keys(patch).length) await api<Home>(`/api/homes/${homeId}`, { method: 'PATCH', body: patch });
    if (canAuthorise !== undefined) await api<Member>(`/api/members/${memberId}`, { method: 'PATCH', body: { canAuthorise } });
  } catch (err) {
    return failure(err);
  }
  refreshAll();
  redirect(`/setup/${homeId}?step=${Math.min(step + 1, 5)}`);
}

export async function activateHome(homeId: string): Promise<ActionState> {
  try {
    await api<{ home: Home; tasks: Task[] }>(`/api/homes/${homeId}/activate`, { method: 'POST' });
  } catch (err) {
    if (err instanceof ApiError && err.code === 'occupancy_not_confirmed') redirect(`/setup/${homeId}?step=1&error=occupancy`);
    return failure(err);
  }
  refreshAll();
  redirect(`/homes/${homeId}?welcome=1`);
}

/** Step 1, "someone lives there": closes the invitation (the home becomes `declined`). */
export async function closeInvitation(homeId: string, token: string): Promise<ActionState> {
  try {
    await api<{ ok: true }>(`/api/invites/${encodeURIComponent(token)}/decline`, { body: { reason: 'someone_lives_there' }, actor: null });
  } catch (err) {
    return failure(err);
  }
  refreshAll();
  redirect(`/setup/${homeId}`);
}
