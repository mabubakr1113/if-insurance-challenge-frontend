import Link from 'next/link';
import type { ForecastDay, HomeWeather, Task, WeatherAlert } from '@/lib/contract';
import { fmtDate, fmtSnow, fmtTemp, fmtTime, fmtWind, helsinkiYmd } from '@/lib/format';
import { firstName, WEATHER_RULE } from '@/lib/labels';
import { link } from './styles';
import { SimLabel } from './ui';

/** Threshold words for a day, so colour is never the only signal. */
export function dayFlags(d: ForecastDay, t: HomeWeather['thresholds']): string[] {
  const flags: string[] = [];
  if (d.minC <= t.hardFrostC) flags.push('hard frost');
  else if (d.minC <= t.frostC) flags.push('frost');
  if (d.gustMs >= t.stormGustMs) flags.push('storm');
  if (d.snowCm >= t.heavySnowCm) flags.push('heavy snow');
  return flags;
}

export function ForecastTable({ weather }: { weather: HomeWeather }) {
  const today = helsinkiYmd();
  const t = weather.thresholds;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] text-left text-sm">
        <caption className="sr-only">Forecast for today and the next 3 days</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-1.5 pr-3 font-medium">
              Day
            </th>
            <th scope="col" className="py-1.5 pr-3 font-medium">
              Min / max
            </th>
            <th scope="col" className="py-1.5 pr-3 font-medium">
              Gusts
            </th>
            <th scope="col" className="py-1.5 font-medium">
              Snow
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {weather.days.map((d) => {
            const flags = dayFlags(d, t);
            return (
              <tr key={d.date}>
                <th scope="row" className="py-2 pr-3 font-medium">
                  {d.date === today ? 'Today' : fmtDate(d.date)}
                  {flags.length ? <span className="block text-xs font-semibold text-attention">{flags.join(', ')}</span> : null}
                </th>
                <td className={`py-2 pr-3 tabular-nums ${d.minC <= t.frostC ? 'font-semibold text-attention' : ''}`}>
                  {fmtTemp(d.minC)} / {fmtTemp(d.maxC)}
                </td>
                <td className={`py-2 pr-3 tabular-nums ${d.gustMs >= t.stormGustMs ? 'font-semibold text-attention' : ''}`}>{fmtWind(d.gustMs)}</td>
                <td className={`py-2 tabular-nums ${d.snowCm >= t.heavySnowCm ? 'font-semibold text-attention' : ''}`}>{fmtSnow(d.snowCm)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ForecastSource({ weather }: { weather: HomeWeather }) {
  if (weather.source === 'simulated') return <SimLabel>Simulated forecast (demo)</SimLabel>;
  return (
    <p className="text-sm text-muted">
      Forecast: Open-Meteo{weather.fetchedAt ? `, updated ${fmtTime(weather.fetchedAt)}` : ''}
    </p>
  );
}

/** "Heating check: nobody has taken it yet" / "Mikko is on it" / "Done" */
export function alertTaskState(alert: WeatherAlert, task: Task | undefined): string | null {
  if (!alert.taskId) return null;
  const status = task?.status ?? alert.taskStatus;
  if (status === 'done') return 'Done';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'accepted') return task?.assignee ? `${firstName(task.assignee.name)} is on it` : 'Someone is on it';
  if (task?.bookingId) return 'A local visit is booked';
  return 'Nobody has taken it yet';
}

export function AlertList({ alerts, tasks, homeId }: { alerts: WeatherAlert[]; tasks: Map<string, Task>; homeId: string }) {
  if (!alerts.length) return <p className="text-sm text-muted">No weather alerts right now.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((a) => {
        const task = a.taskId ? tasks.get(a.taskId) : undefined;
        const state = alertTaskState(a, task);
        return (
          <li key={a.id} className="rounded-lg bg-attention-soft px-3 py-2 text-sm">
            <p className="font-medium text-attention">
              {WEATHER_RULE[a.rule]}, {fmtDate(a.forDate)}: {a.message}
            </p>
            {a.taskId ? (
              <p className="mt-0.5">
                <Link href={`/homes/${homeId}/tasks/${a.taskId}`} className={link}>
                  {task?.title ?? 'The linked task'}
                </Link>
                : {state}
              </p>
            ) : null}
            {a.source === 'simulated' ? (
              <p className="mt-1">
                <SimLabel>Simulated forecast (demo)</SimLabel>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
