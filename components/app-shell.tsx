import type { ReactNode } from 'react';
import type { Dashboard, MeResponse, PartnerJob } from '@/lib/contract';
import { actorLabel, getDashboard, read } from '@/lib/guards';
import { homeStatusText, whoseHome } from '@/lib/labels';
import { ShellFrame, type HomeCard, type NavGroup } from './shell-frame';

/** Navigation for a family member (README "App shell" 3). */
export function familyNav(homeId: string, d: Pick<Dashboard, 'counts' | 'essentialsMissing' | 'weather'> | null, unread: number): NavGroup[] {
  const base = `/homes/${homeId}`;
  return [
    {
      items: [
        { href: base, label: 'Overview', icon: 'overview', exact: true },
        { href: `${base}/plan`, label: 'Care plan', icon: 'plan', badge: d?.counts.needsOwner, badgeLabel: 'need an owner', also: [`${base}/tasks`] },
        { href: `${base}/visits`, label: 'Visits', icon: 'visits' },
        { href: `${base}/notes`, label: 'House notes', icon: 'notes', badge: d?.essentialsMissing.length, badgeLabel: 'essentials missing' },
      ],
    },
    {
      title: 'Look after',
      items: [
        { href: `${base}/weather`, label: 'Weather', icon: 'weather', badge: d?.weather.activeAlerts.length, badgeLabel: 'active alerts' },
        { href: `${base}/help`, label: 'Local visit', icon: 'help' },
      ],
    },
    {
      title: 'People',
      items: [
        { href: `${base}/family`, label: 'Family', icon: 'family' },
        { href: '/notifications', label: 'Messages', icon: 'messages', badge: unread, badgeTone: 'high', badgeLabel: 'unread' },
      ],
    },
    {
      title: 'Home',
      items: [
        { href: `${base}/record`, label: 'Record', icon: 'record' },
        { href: `${base}/settings`, label: 'Settings', icon: 'settings' },
      ],
    },
  ];
}

/**
 * The sidebar frame for anyone viewing as a demo person. Family members get their home card and the home
 * navigation; the partner gets "Visit requests"; the pilot team gets "Pilot dashboard".
 * Pass `dashboard` when the caller already has it (the home layout).
 */
export async function AppShell({ me, dashboard, children }: { me: MeResponse; dashboard?: Dashboard; children: ReactNode }) {
  const who = actorLabel(me);
  let home: HomeCard | undefined;
  let groups: NavGroup[];

  if (me.kind === 'member') {
    // A home still being set up has no dashboard yet; its pages send people to setup anyway.
    const d = dashboard ?? (me.home.status === 'setup' || me.home.status === 'invited' ? null : await getDashboard(me.home.id).catch(() => null));
    const h = d?.home;
    home = {
      title: whoseHome(me.home.estateName),
      line: `${me.home.addressLine}, ${me.home.city} · ${h ? homeStatusText(h) : homeStatusText({ status: me.home.status, closedAt: null })}`,
      active: me.home.status === 'active',
    };
    groups = familyNav(me.home.id, d, me.unread);
  } else if (me.kind === 'partner') {
    const open = await read<PartnerJob[]>('/api/partner/jobs?status=open').catch(() => [] as PartnerJob[]);
    groups = [{ items: [{ href: '/partner', label: 'Visit requests', icon: 'partner', badge: open.length, badgeLabel: 'new' }] }];
  } else {
    groups = [{ items: [{ href: '/insights', label: 'Pilot dashboard', icon: 'insights' }] }];
  }

  return (
    <ShellFrame home={home} groups={groups} persona={{ name: who.name, role: who.role }}>
      {children}
    </ShellFrame>
  );
}
