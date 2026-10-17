import type { Metadata } from 'next';
import { refreshForecast } from '@/app/actions/weather';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Card, Empty, PageHeader } from '@/components/ui';
import { AlertList, ForecastSource, ForecastTable } from '@/components/weather';
import type { Task } from '@/lib/contract';
import { fmtDate, fmtSnow, fmtTemp, fmtWind } from '@/lib/format';
import { requireMember } from '@/lib/guards';
import { getPlan, getWeather } from '@/lib/home-data';
import { WEATHER_RULE } from '@/lib/labels';

export const metadata: Metadata = { title: 'Weather' };

export default async function WeatherPage({ params }: PageProps<'/homes/[homeId]/weather'>) {
  const { homeId } = await params;
  await requireMember(homeId);
  const [weather, plan] = await Promise.all([getWeather(homeId), getPlan(homeId)]);
  const tasks = new Map<string, Task>(plan.tasks.map((t) => [t.id, t]));
  const t = weather.thresholds;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Weather">
        <ActionForm action={refreshForecast.bind(null, homeId)} className="flex flex-col items-end">
          <SubmitButton variant="secondary" pendingText="Refreshing…">
            Refresh forecast
          </SubmitButton>
        </ActionForm>
      </PageHeader>

      <Card title="Today and the next 3 days">
        <ForecastTable weather={weather} />
        <div className="mt-3">
          <ForecastSource weather={weather} />
        </div>
      </Card>

      <Card title="Active alerts">
        <AlertList alerts={weather.activeAlerts} tasks={tasks} homeId={homeId} />
      </Card>

      <Card title="When Home Watch acts">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>{fmtTemp(t.hardFrostC)} or colder: the heating check becomes urgent</li>
          <li>{fmtTemp(t.frostC)} or colder: a heating check is added</li>
          <li>Gusts of {fmtWind(t.stormGustMs)} or more: a check after the storm</li>
          <li>{fmtSnow(t.heavySnowCm)} of snow or more: a roof check from the ground</li>
        </ul>
        <p className="mt-2 text-sm text-muted">Prototype thresholds.</p>
        <p className="mt-3">A forecast can’t tell us the temperature inside. It’s a reason to check, not proof of a problem.</p>
      </Card>

      <Card title="Recent alerts (30 days)">
        {weather.recentAlerts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    Date
                  </th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">
                    Alert
                  </th>
                  <th scope="col" className="py-1.5 font-medium">
                    Checked before the day
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {weather.recentAlerts.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(a.forDate)}</td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{WEATHER_RULE[a.rule]}</span> · {a.message}
                      {a.source === 'simulated' ? <span className="text-muted"> (simulated)</span> : null}
                    </td>
                    <td className="py-2">{a.actionedBeforeDate ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No weather alerts in the last 30 days.</Empty>
        )}
      </Card>
    </div>
  );
}
