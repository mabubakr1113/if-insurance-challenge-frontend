import type {
  AccessMethod,
  Booking,
  BookingStatus,
  BuildingType,
  CheckResult,
  HeatingType,
  Home,
  HomeStatus,
  NoteCategory,
  NotificationChannel,
  PersonRef,
  Relation,
  Role,
  Supervision,
  Task,
  TaskCategory,
  TaskPriority,
  WaterSource,
  WeatherRule,
  YesNoUnknown,
} from './contract';
import { daysUntil, fmtDate, fmtDateTime, fmtSlot } from './format';

/* Enum → English labels (9.4) and status sentences (9.3). */

export const ROLE: Record<Role, string> = { coordinator: 'Coordinator', helper: 'Helper', viewer: 'Viewer' };

export const ROLE_MEANING: Record<Role, string> = {
  coordinator: 'manages the plan, the family and the home’s status',
  helper: 'takes tasks, records visits, adds notes',
  viewer: 'sees everything and can comment',
};

export const AUTHORISE_MEANING = 'may authorise a partner’s access to the home';

export const RELATION: Record<Relation, string> = {
  child: 'Child',
  spouse: 'Spouse',
  sibling: 'Sibling',
  grandchild: 'Grandchild',
  relative: 'Other relative',
  friend: 'Friend',
  other: 'Other',
};

export const HOME_STATUS: Record<HomeStatus, string> = {
  invited: 'Invited',
  setup: 'Setting up',
  active: 'Active',
  occupied: 'Lived in again',
  sold: 'Sold',
  transferred: 'Passed to an heir',
  closed: 'Closed',
  declined: 'Not used (someone lives there)',
};

export const BUILDING: Record<BuildingType, string> = {
  detached: 'Detached house',
  semi_detached: 'Semi-detached',
  terraced: 'Terraced house',
  cottage: 'Cottage',
  other: 'Other',
};

export const HEATING: Record<HeatingType, string> = {
  district: 'District heating',
  electric: 'Electric heating',
  oil: 'Oil heating',
  ground_heat_pump: 'Ground-source heat pump',
  air_heat_pump: 'Air heat pump',
  wood: 'Wood heating',
  unknown: 'Not sure',
};

export const WATER: Record<WaterSource, string> = { municipal: 'Municipal water', well: 'Own well', unknown: 'Not sure' };

export const YES_NO: Record<YesNoUnknown, string> = { yes: 'Yes', no: 'No', unknown: 'Not sure' };

export const PRIORITY: Record<TaskPriority, string> = { urgent: 'Urgent', high: 'High', normal: 'Normal' };

export const CATEGORY: Record<TaskCategory, string> = {
  water: 'Water',
  heating: 'Heating',
  electricity: 'Electricity',
  security: 'Security',
  outside: 'Outside',
  admin: 'Paperwork',
  visit: 'Visit',
  appliances: 'Appliances',
  other: 'Other',
};

export const CHECK_RESULT: Record<CheckResult, string> = { ok: 'OK', concern: 'Concern', not_checked: 'Not checked' };

export const NOTE_CATEGORY: Record<NoteCategory, string> = {
  water: 'Water',
  heating: 'Heating',
  electricity: 'Electricity',
  access: 'Access',
  contacts: 'Contacts',
  appliances: 'Appliances',
  other: 'Other',
};

export const BOOKING_STATUS: Record<BookingStatus, string> = {
  pending_approval: 'Waiting for approval',
  requested: 'Sent to partner',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Done',
  cancelled: 'Cancelled',
  declined: 'Declined',
};

/** The booking form takes these from `BookingOptions`; pages that show a saved booking use this copy. */
export const ACCESS_METHOD: Record<AccessMethod, string> = {
  key_holder_meets: 'A family member or the key holder meets the partner',
  key_box: 'Key in a key box (code given to the partner)',
  partner_collects_key: 'Partner collects the key from someone nearby',
  other: 'Other arrangement',
};

export const WEATHER_RULE: Record<WeatherRule, string> = {
  hard_frost: 'Hard frost',
  frost: 'Frost',
  storm: 'Storm',
  heavy_snow: 'Heavy snow',
};

export const CHANNEL: Record<NotificationChannel, string> = { in_app: 'In app', sms: 'SMS (simulated)', email: 'Email (simulated)' };

/** `[value, label]` pairs for selects and radio groups, in declaration order. */
export const options = <K extends string>(labels: Record<K, string>) => Object.entries(labels) as [K, string][];

/** "Aino, Mikko and Sanna" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export const firstName = (name: string) => name.split(' ')[0] ?? name;

/* ---------------- status sentences ---------------- */

export function supervisionText(s: Supervision): string {
  switch (s.state) {
    case 'no_visit_yet':
      return `No visit recorded yet. The first visit is due ${fmtDate(s.nextDueAt)}.`;
    case 'ok':
      return `Last visit ${s.daysSinceLastVisit ?? 0} days ago by ${s.lastVisitorName ?? 'someone'}. Next one due by ${fmtDate(s.nextDueAt)}.`;
    case 'due_soon': {
      const n = Math.max(0, daysUntil(s.nextDueAt));
      return `Next visit due in ${n} ${n === 1 ? 'day' : 'days'} (${fmtDate(s.nextDueAt)}).`;
    }
    case 'overdue': {
      const n = Math.max(1, -daysUntil(s.nextDueAt));
      return `The monthly visit is ${n} ${n === 1 ? 'day' : 'days'} overdue.`;
    }
  }
}

export function bookingText(b: Booking, approvers: PersonRef[] = []): string {
  switch (b.status) {
    case 'pending_approval':
      return approvers.length ? `Waiting for approval from ${joinNames(approvers.map((p) => p.name))}.` : 'Waiting for approval.';
    case 'requested':
      return `Sent to ${b.partner.name}, waiting for them to confirm.`;
    case 'confirmed':
      return `Confirmed for ${fmtSlot(b.slotStart, b.slotEnd)}.`;
    case 'in_progress':
      return `${b.partner.name} is at the house now.`;
    case 'completed':
      return 'Visit done. The report is ready.';
    case 'cancelled':
      return `Cancelled: ${b.cancelReason ?? 'no reason given'}.`;
    case 'declined':
      return `${b.partner.name} couldn’t take this visit: ${b.cancelReason ?? 'no reason given'}.`;
  }
}

/** "Nobody has taken this yet" · "Mikko is on it" · "Done by Mikko on Mon 20 Oct" · "Cancelled" */
export function taskStatusText(t: Task): string {
  if (t.status === 'cancelled') return 'Cancelled';
  if (t.status === 'done') return `Done by ${t.completedByLabel ?? 'someone'}${t.completedAt ? ` on ${fmtDate(t.completedAt)}` : ''}`;
  if (t.assignee) return `${firstName(t.assignee.name)} is on it`;
  return 'Nobody has taken this yet';
}

/** Status sentence with the due date, for the task page. */
export function taskHeadline(t: Task): string {
  const base = taskStatusText(t);
  if ((t.status === 'open' || t.status === 'accepted') && t.dueAt) return `${base}, due ${fmtDateTime(t.dueAt)}`;
  return base;
}

/** "Active" · "Closed: sold on Tue 21 Oct" */
export function homeStatusText(home: Pick<Home, 'status' | 'closedAt'>): string {
  if (!home.closedAt || home.status === 'active' || home.status === 'setup' || home.status === 'invited') return HOME_STATUS[home.status];
  const what: Partial<Record<HomeStatus, string>> = {
    occupied: 'lived in again',
    sold: 'sold',
    transferred: 'passed to an heir',
    closed: 'closed',
    declined: 'someone lives there',
  };
  return `Closed: ${what[home.status] ?? 'closed'} on ${fmtDate(home.closedAt)}`;
}

export const whoseHome = (estateName: string | null) => (estateName ? `${estateName}’s home` : 'The home');
