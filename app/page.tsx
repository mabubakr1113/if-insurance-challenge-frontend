import { PublicShell } from '@/components/public-shell';
import { StartDemoLink } from '@/components/start-demo-link';
import { eyebrow } from '@/components/styles';
import { ButtonLink } from '@/components/ui';

const PROBLEMS = [
  { title: 'Nobody owns the house.', body: 'Each sibling assumes another will go.' },
  { title: 'Nobody knows the house.', body: 'Where’s the water main valve? Is the heating on?' },
  {
    title: 'The rules are in a policy PDF.',
    body: 'If’s home terms describe supervising an empty home as a visit at least monthly, and say the water main should be closed when it’s unoccupied for more than a week (§5, §5.5).',
  },
];

const STEPS = [
  'If offers help when the family gets in touch about the estate',
  'Answer a few questions; get an ordered care plan with reasons',
  'Every task gets a named owner',
  'A cold night or storm turns into a check',
  'If nobody can go, book a vetted local visit and get a report with photos',
];

const GETS = ['One shared plan', 'A named owner for every task', 'House notes in one place', 'A record of every visit'];

const ISNT = [
  'Not a claim guarantee: the record shows what was checked, not what’s covered.',
  'Not a safety score.',
  'Never contact based only on a death notice.',
  'Not a sensor product.',
];

const h2 = 'font-display text-[32px] leading-[1.1] font-normal tracking-[-0.02em]';

export default function LandingPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-16">
        <section className="flex flex-col gap-5 pt-4">
          <h1 className="max-w-3xl font-display text-[44px] leading-[1.04] font-normal tracking-[-0.03em] text-balance wide:text-[64px]">
            When a parent’s home is left empty, <em className="text-accent-text">someone has to look after it.</em>
          </h1>
          <p className="max-w-[560px] text-lg leading-[1.55] text-muted">
            If Home Watch helps the family share the care: what needs doing, who’s on it, and help when nobody can go.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <StartDemoLink />
            <ButtonLink href="#how" variant="secondary">
              How it works
            </ButtonLink>
          </div>
          <p className="text-[13px] text-muted">No signup or login needed. Explore a home with sample tasks, visits and photos.</p>
        </section>

        <section aria-labelledby="problem" className="flex flex-col gap-5">
          <h2 id="problem" className={h2}>
            The problem
          </h2>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {PROBLEMS.map((p) => (
              <article key={p.title} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-[22px]">
                <h3 className="text-base font-semibold">{p.title}</h3>
                <p className="text-[15px] leading-[1.55] text-muted">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" aria-labelledby="how-title" className="flex scroll-mt-6 flex-col gap-5">
          <h2 id="how-title" className={h2}>
            How it works
          </h2>
          <ol className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
            {STEPS.map((step, i) => (
              <li key={step} className="-mb-px flex items-start gap-3.5 border-b border-line-soft px-[18px] py-3.5">
                <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[15px] leading-normal">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="story" className="flex flex-col gap-3 rounded-2xl bg-attention-soft px-7 py-8">
          <span className={`${eyebrow} text-attention`}>A cold night</span>
          <h2 id="story" className="font-display text-[26px] leading-[1.25] font-normal text-attention-strong">
            −18 °C is forecast for Tuesday. The heating check becomes urgent, and nobody has taken it.
          </h2>
          <p className="max-w-3xl text-[15px] leading-[1.6] text-attention-ink">
            Aino books a check visit in two minutes. By lunchtime the report is in: 17 °C inside, heating running, one photo of snow building up on the roof,
            already added as a task.
          </p>
        </section>

        <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
          <section aria-labelledby="gets" className="flex flex-col gap-4">
            <h2 id="gets" className={h2}>
              What families get
            </h2>
            <ul className="flex flex-col gap-2 text-[15px]">
              {GETS.map((g) => (
                <li key={g} className="flex gap-2.5">
                  <span aria-hidden="true" className="text-ok">
                    ✓
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="isnt" className="flex flex-col gap-4">
            <h2 id="isnt" className={h2}>
              What it isn’t
            </h2>
            <ul className="flex flex-col gap-2 text-[15px] text-muted">
              {ISNT.map((g) => (
                <li key={g} className="flex gap-2.5">
                  <span aria-hidden="true">–</span>
                  {g}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="why" className="flex flex-col gap-3">
          <h2 id="why" className={h2}>
            Why If
          </h2>
          <p className="max-w-3xl text-lg leading-[1.55] text-muted">
            If knows the moment, writes the rules and is there when the home changes hands. Home Watch uses all three to prevent damage instead of paying
            for it afterwards.
          </p>
        </section>

        <section className="flex flex-col items-center gap-5 rounded-2xl bg-ink px-6 py-10 text-center text-white">
          <p className="max-w-2xl font-display text-[26px] leading-[1.25]">The family knows who is looking after the house, and can get help when nobody can go.</p>
          <a href="/demo/start" className="inline-flex h-[42px] items-center rounded-[10px] bg-white px-4 text-sm font-semibold text-ink hover:bg-hover-btn">
            Try the demo
          </a>
        </section>
      </div>
    </PublicShell>
  );
}
