import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-2xl font-semibold">We couldn’t find that page.</h1>
      <p className="mt-2 text-muted">The link may be old, or the demo may have been reset.</p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/demo" variant="secondary">
          Demo
        </ButtonLink>
      </div>
    </div>
  );
}
