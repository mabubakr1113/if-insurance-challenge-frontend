import type { Metadata } from 'next';
import Link from 'next/link';
import { refreshForecast } from '@/app/actions/weather';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Card, PageHeader, SimLabel } from '@/components/ui';
import { alertMeasure, alertTaskState, dayFlags, daySummary, ForecastSource } from '@/components/weather';
import type { Task } from '@/lib/contract';
import { fmtDate, fmtSnow, fmtTemp, fmtWind, helsinkiYmd } from '@/lib/format';
import { getHome, requireMember } from '@/lib/guards';
import { getPlan, getWeather } from '@/lib/home-data';
import { WEATHER_RULE } from '@/lib/labels';

export const metadata: Metadata = { title: 'Weather' };

export default async function WeatherPage({ params }: PageProps<'/homes/[homeId]/weather'>) {
  const { homeId } = await params;
  await requireMember(homeId);
  const [weather, plan, home] = await Promise.all([getWeather(homeId), getPlan(homeId), getHome(homeId)]);
  const tasks = new Map<string, Task>(plan.tasks.map((t) => [t.id, t]));
  const t = weather.thresholds;
  const today = helsinkiYmd();
  const rules: [string, string][] = [
    [`${fmtTemp(t.hardFrostC)} or colder`, 'the heating check becomes urgent'],
    [`${fmtTemp(t.frostC)} or colder`, 'a heating check is added'],
    [`Gusts of ${fmtWind(t.stormGustMs)} or more`, 'a check after the storm'],
    [`${fmtSnow(t.heavySnowCm)} of snow or more`, 'a roof check from the ground'],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Weather"
        intro={
          <>
            {home.city} · <ForecastSource weather={weather} />
          </>
        }
        actions={
          <ActionForm action={refreshForecast.bind(null, homeId)} className="flex flex-col items-end">
            <SubmitButton variant="secondary" pendingText="Refreshing…">
              Refresh forecast
            </SubmitButton>
          </ActionForm>
        }
      />

      <ul aria-label="Forecast for today and the next 3 days" className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
        {weather.days.map((d) => {
          const alert = dayFlags(d, t).length > 0;
          return (
            <li key={d.date} className={`flex flex-col gap-1.5 rounded-2xl p-5 ${alert ? 'bg-attention-soft' : 'bg-tile'}`}>
              <span className="text-[13px] text-muted">{d.date === today ? `Today · ${fmtDate(d.date)}` : fmtDate(d.date)}</span>
              <span className={`font-display text-[40px] leading-none ${alert ? 'text-attention' : 'text-ink'}`}>
                <span className="sr-only">Low </span>
                {fmtTemp(d.minC)}
              </span>
              <span className={`text-sm ${alert ? 'font-semibold text-attention-ink' : ''}`}>{daySummary(d, t)}</span>
            </li>
          );
        })}
      </ul>

      <Card size="section" title={weather.activeAlerts.length > 1 ? 'Active alerts' : 'Active alert'}>
        {weather.activeAlerts.length ? (
          <ul className="flex flex-col gap-2.5">
            {weather.activeAlerts.map((a) => {
              const task = a.taskId ? tasks.get(a.taskId) : undefined;
              const state = alertTaskState(a, task);
              const measure = alertMeasure(a, weather);
              const body = (
                <>
                  <span className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-attention-ink">
                      {WEATHER_RULE[a.rule]} · {fmtDate(a.forDate)}
                      {a.source === 'simulated' ? <SimLabel>Simulated forecast (demo)</SimLabel> : null}
                    </span>
                    <span className="text-sm text-attention-ink">
                      {measure ? `${measure.charAt(0).toUpperCase()}${measure.slice(1)} forecast. ` : ''}
                      {state ? `${task?.title ?? 'The check'}: ${state}.` : a.message}
                    </span>
                  </span>
                  {a.taskId ? <span className="text-[13px] font-semibold text-attention-ink">Open the task →</span> : null}
                </>
              );
              const box = 'flex flex-wrap items-center justify-between gap-3 rounded-xl bg-attention-soft p-4';
              return (
                <li key={a.id}>
                  {a.taskId ? (
                    <Link href={`/homes/${homeId}/tasks/${a.taskId}`} className={`${box} hover:bg-[#f8e7cd]`}>
                      {body}
                    </Link>
                  ) : (
                    <div className={box}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No weather alerts right now. Home Watch checks the forecast every day.</p>
        )}
      </Card>

      <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
        <Card size="section" title="When Home Watch acts" className="gap-2.5">
          <ul className="flex flex-col gap-2.5">
            {rules.map(([a, b]) => (
              <li key={a} className="flex flex-wrap gap-x-2.5 text-sm leading-normal">
                <span className="min-w-[150px] shrink-0 font-semibold">{a}</span>
                <span className="text-ink-soft">{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[13px] text-muted">
            A forecast can’t tell us the temperature inside. It’s a reason to check, not proof of a problem. Prototype thresholds.
          </p>
        </Card>
      </div>
    </div>
  );
}
