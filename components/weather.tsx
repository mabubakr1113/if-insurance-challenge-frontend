import Link from 'next/link';
import type { ForecastDay, HomeWeather, Task, WeatherAlert } from '@/lib/contract';
import { fmtDate, fmtSnow, fmtTemp, fmtTime, fmtWind } from '@/lib/format';
import { firstName, WEATHER_RULE } from '@/lib/labels';
import { SimLabel } from './ui';

/** Threshold words for a day, so colour is never the only signal. */
export function dayFlags(d: ForecastDay, t: HomeWeather['thresholds']): string[] {
  const flags: string[] = [];
  if (d.minC <= t.hardFrostC) flags.push('Hard frost');
  else if (d.minC <= t.frostC) flags.push('Frost');
  if (d.gustMs >= t.stormGustMs) flags.push('Storm');
  if (d.snowCm >= t.heavySnowCm) flags.push('Heavy snow');
  return flags;
}

/** "High 2 °C · Hard frost" or "High 2 °C · Gusts 6 m/s · Snow 2 cm" */
export function daySummary(d: ForecastDay, t: HomeWeather['thresholds']): string {
  const flags = dayFlags(d, t);
  const rest = flags.length ? flags.join(', ') : [`Gusts ${fmtWind(d.gustMs)}`, d.snowCm > 0 ? `Snow ${fmtSnow(d.snowCm)}` : null].filter(Boolean).join(' · ');
  return `High ${fmtTemp(d.maxC)} · ${rest}`;
}

export function ForecastSource({ weather }: { weather: Pick<HomeWeather, 'source' | 'fetchedAt'> }) {
  if (weather.source === 'simulated') return <SimLabel>Simulated forecast (demo)</SimLabel>;
  return <>Open-Meteo forecast{weather.fetchedAt ? `, updated ${fmtDate(weather.fetchedAt)} at ${fmtTime(weather.fetchedAt)}` : ''}</>;
}

/** "nobody has taken it yet" / "Mikko is on it" / "done" */
export function alertTaskState(alert: WeatherAlert, task: Task | undefined): string | null {
  if (!alert.taskId) return null;
  const status = task?.status ?? alert.taskStatus;
  if (status === 'done') return task?.completedByLabel ? `done by ${firstName(task.completedByLabel)}` : 'done';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'accepted') return task?.assignee ? `${firstName(task.assignee.name)} is on it` : 'someone is on it';
  if (task?.bookingId) return 'a local visit is booked';
  return 'nobody has taken it yet';
}

/** The number that matters for the alert's day: the low for frost, gusts for a storm, snow for heavy snow. */
export function alertMeasure(alert: WeatherAlert, weather: HomeWeather): string | null {
  const day = weather.days.find((d) => d.date === alert.forDate);
  if (!day) return null;
  if (alert.rule === 'storm') return `gusts ${fmtWind(day.gustMs)}`;
  if (alert.rule === 'heavy_snow') return `${fmtSnow(day.snowCm)} of snow`;
  return fmtTemp(day.minC);
}

/** Overview rail: the most pressing alert as an amber card that opens the weather page. */
export function WeatherAlertCard({ weather, tasks, href }: { weather: HomeWeather; tasks: Map<string, Task>; href: string }) {
  const alert = weather.activeAlerts[0];
  if (!alert) {
    return (
      <Link href={href} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5 hover:bg-hover">
        <span className="text-[11px] font-bold tracking-[0.08em] text-faint uppercase">Weather</span>
        <span className="font-display text-[23px] leading-[1.2]">No alerts for the next 3 days</span>
        <span className="text-[13px] text-muted">
          <ForecastSource weather={weather} />
        </span>
      </Link>
    );
  }
  const task = alert.taskId ? tasks.get(alert.taskId) : undefined;
  const measure = alertMeasure(alert, weather);
  const state = alertTaskState(alert, task);
  return (
    <Link href={href} className="flex flex-col gap-2 rounded-2xl bg-attention-soft p-5 hover:bg-[#f8e7cd]">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.08em] text-attention uppercase">
          Weather alert{weather.activeAlerts.length > 1 ? ` · ${weather.activeAlerts.length}` : ''}
        </span>
        {alert.source === 'simulated' ? <span className="text-[11px] font-semibold text-attention-ink">Simulated</span> : null}
      </span>
      <span className="font-display text-[23px] leading-[1.2] text-attention-strong">
        {WEATHER_RULE[alert.rule]} on {fmtDate(alert.forDate)}
        {measure ? `, ${measure}` : ''}
      </span>
      <span className="text-[13px] text-attention-ink">{state ? `${task?.title ?? 'The check'}: ${state}` : alert.message}</span>
    </Link>
  );
}
