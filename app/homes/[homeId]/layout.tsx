import { AppShell } from '@/components/app-shell';
import { Notice } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { currentPath, getDashboard, isClosed, isPrintPath, requireMember } from '@/lib/guards';

/** P6: the home shell (sidebar, or top bar and drawer below 720px) around every /homes/[homeId]/* page. */
export default async function HomeLayout({ children, params }: LayoutProps<'/homes/[homeId]'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  if (isPrintPath(await currentPath())) return children;

  const dashboard = await getDashboard(homeId);
  const { home } = dashboard;

  return (
    <AppShell me={me} dashboard={dashboard}>
      {isClosed(home) ? (
        <Notice tone="neutral" role="status" className="mb-6">
          This plan was closed{home.closedAt ? ` on ${fmtDate(home.closedAt)}` : ''}
          {home.closeReason ? ` (${home.closeReason})` : ''}. Everything stays readable, and you can still download the record.
        </Notice>
      ) : null}
      {children}
    </AppShell>
  );
}
