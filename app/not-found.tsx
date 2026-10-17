import { PublicShell } from '@/components/public-shell';
import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <PublicShell>
      <div className="mx-auto my-12 flex max-w-[520px] flex-col items-center gap-4 text-center">
        <h1 className="font-display text-[32px] leading-tight font-normal tracking-[-0.02em]">We couldn’t find that page</h1>
        <p className="text-base leading-[1.55] text-muted">The link may be old, or the demo may have been reset.</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <ButtonLink href="/">Home</ButtonLink>
          <ButtonLink href="/demo" variant="secondary">
            Demo
          </ButtonLink>
        </div>
      </div>
    </PublicShell>
  );
}
