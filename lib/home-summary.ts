import type { Dashboard, PlanResponse, Task } from './contract';
import { fmtDate, fmtDateTime, fmtTemp } from './format';
import { BOOKING_STATUS, HOME_STATUS, supervisionText, WEATHER_RULE, whoseHome } from './labels';

export interface HomeSummary {
  homeName: string;
  address: string;
  overview: string;
  stats: { label: string; value: number }[];
  nextSteps: { title: string; detail: string; href: string }[];
  weather: string;
  visits: string;
  updates: { id: string; message: string; at: string; href: string | null }[];
  planHref: string;
  weatherHref: string;
  visitsHref: string;
}

const count = (n: number, singular: string, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;
const rank = (task: Task) => (task.priority === 'urgent' ? 100 : 0) + (task.isOverdue ? 50 : 0) + (task.needsOwner ? 25 : 0) + (task.priority === 'high' ? 10 : 0);

/** Builds a local, deterministic summary from the same authorised data as the overview. */
export function buildHomeSummary(d: Dashboard, plan: PlanResponse): HomeSummary {
  const base = `/homes/${d.home.id}`;
  const active = d.home.status === 'active';
  const tasks = plan.tasks.filter((task) => task.status === 'open' || task.status === 'accepted');
  const overdue = tasks.filter((task) => task.isOverdue).length;
  const unowned = tasks.filter((task) => task.needsOwner).length;
  const nextSteps: HomeSummary['nextSteps'] = [];

  if (active) {
    for (const task of [...tasks].sort((a, b) => rank(b) - rank(a) || (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999')).slice(0, 3)) {
      const detail = [
        task.priority === 'urgent' ? 'Urgent' : null,
        task.isOverdue ? `Overdue${task.dueAt ? ` since ${fmtDate(task.dueAt)}` : ''}` : task.dueAt ? `Due ${fmtDate(task.dueAt)}` : 'No due date set',
        task.assignee ? `${task.assignee.name} is on it` : task.bookingId ? 'Covered by a local visit' : 'No owner assigned',
      ].filter(Boolean).join(' · ');
      nextSteps.push({ title: task.title, detail, href: `${base}/tasks/${task.id}` });
    }
    if (nextSteps.length < 3 && d.essentialsMissing.length) {
      nextSteps.push({
        title: 'Confirm the house essentials',
        detail: `${count(d.essentialsMissing.length, 'detail')} still missing or unconfirmed: ${d.essentialsMissing.slice(0, 2).map((item) => item.label.toLowerCase()).join(', ')}.`,
        href: `${base}/notes`,
      });
    }
    if (nextSteps.length < 3 && ['overdue', 'due_soon', 'no_visit_yet'].includes(d.supervision.state)) {
      nextSteps.push({ title: 'Arrange the next visit', detail: supervisionText(d.supervision), href: `${base}/visits` });
    }
  }

  const alerts = d.weather.activeAlerts;
  const coldest = d.weather.days.reduce<(typeof d.weather.days)[number] | null>((lowest, day) => !lowest || day.minC < lowest.minC ? day : lowest, null);
  const weather = alerts.length
    ? `${count(alerts.length, 'active weather alert')}: ${alerts.slice(0, 2).map((alert) => `${WEATHER_RULE[alert.rule].toLowerCase()} on ${fmtDate(alert.forDate)}`).join('; ')}. Review the linked checks before those dates.`
    : coldest
      ? `No active weather alerts are recorded. The lowest temperature in the current forecast is ${fmtTemp(coldest.minC)} on ${fmtDate(coldest.date)}.`
      : 'The forecast is currently unavailable. Open Weather to check for an update.';
  const lastVisit = d.supervision.lastVisitAt
    ? `Last recorded visit: ${fmtDate(d.supervision.lastVisitAt)}${d.supervision.lastVisitorName ? ` by ${d.supervision.lastVisitorName}` : ''}. `
    : 'No visit has been recorded yet. ';
  const booking = d.activeBooking;
  const visits = `${lastVisit}${active ? `Next visit due ${fmtDate(d.supervision.nextDueAt)}.` : 'The care plan is no longer active.'}${booking ? ` ${booking.package.name}: ${BOOKING_STATUS[booking.status].toLowerCase()}, ${fmtDateTime(booking.slotStart)}.` : ''}`;

  return {
    homeName: whoseHome(d.home.estateName),
    address: `${d.home.addressLine}, ${d.home.city}`,
    overview: active
      ? `${count(tasks.length, 'task')} ${tasks.length === 1 ? 'is' : 'are'} open${overdue ? `, including ${overdue} overdue` : ''}.${unowned ? ` ${count(unowned, 'task')} ${unowned === 1 ? 'needs' : 'need'} someone to take ownership.` : ' No time-sensitive tasks are waiting for an owner.'} ${d.counts.doneLast30d ? `${count(d.counts.doneLast30d, 'task')} completed in the last 30 days.` : ''}`.trim()
      : `The care plan is ${HOME_STATUS[d.home.status].toLowerCase()}. The home record keeps the visits, tasks and updates available to the family.`,
    stats: [{ label: 'Open tasks', value: tasks.length }, { label: 'Overdue', value: overdue }, { label: 'Weather alerts', value: alerts.length }],
    nextSteps,
    weather,
    visits,
    updates: [...d.recentActivity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map((item) => ({
      id: item.id,
      message: item.message,
      at: item.createdAt,
      href: item.visitId ? `${base}/visits/${item.visitId}` : item.bookingId ? `${base}/help/${item.bookingId}` : item.taskId ? `${base}/tasks/${item.taskId}` : null,
    })),
    planHref: `${base}/plan`,
    weatherHref: `${base}/weather`,
    visitsHref: `${base}/visits`,
  };
}
