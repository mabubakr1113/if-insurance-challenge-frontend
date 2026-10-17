import { ButtonLink, Card } from '@/components/ui';
import { StartDemoLink } from '@/components/start-demo-link';

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

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-14">
      <section className="pt-6">
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          When a parent’s home is left empty, someone has to look after it.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          If Home Watch helps the family share the care: what needs doing, who’s on it, and help when nobody can go.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <StartDemoLink />
          <ButtonLink href="#how" variant="secondary">
            How it works
          </ButtonLink>
        </div>
        <p className="mt-3 text-sm text-muted">No signup or login needed. Explore a home with sample tasks, visits and photos.</p>
      </section>

      <section aria-labelledby="problem">
        <h2 id="problem" className="text-2xl font-semibold">
          The problem
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PROBLEMS.map((p) => (
            <Card key={p.title} as="article">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" aria-labelledby="how-title" className="scroll-mt-6">
        <h2 id="how-title" className="text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-4 grid gap-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 rounded-xl border border-line bg-card px-4 py-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="story" className="rounded-2xl bg-accent-soft px-6 py-8">
        <h2 id="story" className="text-2xl font-semibold text-accent-strong">
          A cold night
        </h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed">
          −18 °C is forecast for Tuesday. The heating check becomes urgent, and nobody has taken it. Aino books a check visit in two minutes. By
          lunchtime the report is in: 17 °C inside, heating running, one photo of snow building up on the roof, already added as a task.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="gets">
          <h2 id="gets" className="text-2xl font-semibold">
            What families get
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {GETS.map((g) => (
              <li key={g} className="flex gap-2">
                <span aria-hidden className="text-ok">
                  ✓
                </span>
                {g}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="isnt">
          <h2 id="isnt" className="text-2xl font-semibold">
            What it isn’t
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-muted">
            {ISNT.map((g) => (
              <li key={g} className="flex gap-2">
                <span aria-hidden>–</span>
                {g}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="why">
        <h2 id="why" className="text-2xl font-semibold">
          Why If
        </h2>
        <p className="mt-3 max-w-3xl text-lg text-muted">
          If knows the moment, writes the rules and is there when the home changes hands. Home Watch uses all three to prevent damage instead of
          paying for it afterwards.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-card px-6 py-8 text-center">
        <p className="mx-auto max-w-2xl text-xl font-medium">
          The family knows who is looking after the house, and can get help when nobody can go.
        </p>
        <div className="mt-5">
          <StartDemoLink />
        </div>
      </section>
    </div>
  );
}
