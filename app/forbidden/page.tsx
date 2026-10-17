import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui';
import { actorLabel, getMe } from '@/lib/guards';

export const metadata: Metadata = { title: 'No access' };

const AREAS = {
  family: 'This part is for the family.',
  partner: 'This part is for the visit partner.',
  staff: 'This part is for If’s pilot team.',
} as const;

export default async function ForbiddenPage({ searchParams }: PageProps<'/forbidden'>) {
  const { area } = await searchParams;
  const me = await getMe();
  const who = me ? actorLabel(me) : null;
  const areaText = typeof area === 'string' && area in AREAS ? AREAS[area as keyof typeof AREAS] : null;

  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-2xl font-semibold">{areaText ?? 'You don’t have access to this home.'}</h1>
      {who ? <p className="mt-2 text-muted">You’re viewing as {who.name}.</p> : null}
      <div className="mt-6 flex justify-center gap-2">
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
