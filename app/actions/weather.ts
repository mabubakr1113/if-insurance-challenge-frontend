'use server';

import type { ActionState } from '@/lib/action-state';
import { act } from '@/lib/actions';
import { api } from '@/lib/api';
import type { HomeWeather } from '@/lib/contract';

export async function refreshForecast(homeId: string): Promise<ActionState> {
  return act(() => api<HomeWeather>(`/api/homes/${homeId}/weather/refresh`, { method: 'POST' }), {
    message: (w) => (w.source === 'simulated' ? 'The simulated forecast stays in place until the presenter switches back.' : 'Forecast updated.'),
  });
}
