import type { ReactNode } from 'react';
import { getMe } from '@/lib/guards';
import { AppShell } from './app-shell';
import { PublicShell } from './public-shell';

/** Layout for /notifications, /partner and /insights: the app frame for whoever the demo cookie says you are. */
export async function ActorFrame({ children }: { children: ReactNode }) {
  const me = await getMe().catch(() => null);
  // No person yet: the page's guard sends them to the demo page.
  if (!me) return <PublicShell>{children}</PublicShell>;
  return <AppShell me={me}>{children}</AppShell>;
}
