import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui';
import { actorLabel, getMe } from '@/lib/guards';

export const metadata: Metadata = { title: 'No access' };

const AREAS = {
  family: 'This part is for the family',
  partner: 'This part is for the visit partner',
  staff: 'This part is for If’s pilot team',
} as const;

export default async function ForbiddenPage({ searchParams }: PageProps<'/forbidden'>) {
  const { area } = await searchParams;
  const me = await getMe();
  const who = me ? actorLabel(me) : null;
  const areaText = typeof area === 'string' && area in AREAS ? AREAS[area as keyof typeof AREAS] : null;

  return (
    <div className="mx-auto my-12 flex max-w-[520px] flex-col items-center gap-4 text-center">
      <h1 className="font-display text-[32px] leading-tight font-normal tracking-[-0.02em]">{areaText ?? 'You don’t have access to this home'}</h1>
      {who ? <p className="text-base leading-[1.55] text-muted">You’re viewing as {who.name}.</p> : null}
      <div className="flex flex-wrap justify-center gap-2.5">
        <ButtonLink href="/demo">Switch person</ButtonLink>
        {who ? (
          <ButtonLink href={who.home} variant="secondary">
            Go to your own area
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
