'use client';

import { useState } from 'react';
import type { FormAction } from '@/lib/action-state';
import type { BookingOptions, PackageKey } from '@/lib/contract';
import { fmtDate, fmtMoney, fmtSlot, fmtTime, helsinkiYmd } from '@/lib/format';
import { joinNames } from '@/lib/labels';
import { ActionForm, Field, FieldError, SubmitButton } from './forms';
import { checkbox, radio, textarea } from './styles';
import { SimLabel } from './ui';

const card = 'flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-4 has-[:checked]:border-accent has-[:checked]:bg-accent-soft';

/** P17: choose a visit, a time and access, then review and approve, as one page. */
export function BookingForm({ options, action, defaultPackage }: { options: BookingOptions; action: FormAction; defaultPackage: PackageKey }) {
  const [packageKey, setPackageKey] = useState<PackageKey>(defaultPackage);
  const [slotStart, setSlotStart] = useState<string>('');
  const [accessMethod, setAccessMethod] = useState<string>('');
  const pkg = options.packages.find((p) => p.key === packageKey) ?? options.packages[0];
  const slots = options.slots[packageKey] ?? [];
  const slot = slots.find((s) => s.start === slotStart);
  const access = options.accessMethods.find((a) => a.key === accessMethod);
  const nobodyCanApprove = !options.canApprove && options.authorisedMembers.length === 0;

  const days = new Map<string, typeof slots>();
  for (const s of slots) {
    const day = helsinkiYmd(s.start);
    days.set(day, [...(days.get(day) ?? []), s]);
  }

  return (
    <ActionForm action={action} className="flex flex-col gap-8">
      <section aria-labelledby="choose-visit">
        <h2 id="choose-visit" className="mb-3 text-lg font-semibold">
          1. Choose a visit
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {options.packages.map((p) => (
            <label key={p.key} className={card}>
              <input
                type="radio"
                name="packageKey"
                value={p.key}
                checked={packageKey === p.key}
                onChange={() => {
                  setPackageKey(p.key);
                  setSlotStart('');
                }}
                className={radio}
              />
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm text-muted">
                  {p.durationMin} min · {p.leadTime}
                </span>
                <ul className="mt-1 list-disc pl-4 text-sm">
                  {p.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <span className="mt-2 text-lg font-semibold">{fmtMoney(p.totalCents)}</span>
                <span className="text-sm text-muted">
                  {fmtMoney(p.partnerPriceCents)} to the partner + {fmtMoney(p.ifFeeCents)} If coordination fee
                </span>
                <span>
                  <SimLabel>Prototype price, not a quote</SimLabel>
                </span>
              </span>
            </label>
          ))}
        </div>
        <FieldError name="packageKey" />
      </section>

      <section aria-labelledby="choose-time">
        <h2 id="choose-time" className="mb-3 text-lg font-semibold">
          2. Choose a time
        </h2>
        {slots.length === 0 ? (
          <p className="text-muted">No times left in the next 3 days. The urgent check may still have one.</p>
        ) : (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Times for the {pkg.name.toLowerCase()}</legend>
            {[...days.entries()].map(([day, list]) => (
              <div key={day} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="w-28 shrink-0 font-medium">{fmtDate(day)}</span>
                <span className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <label key={s.start} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-semibold">
                      <input type="radio" name="slotStart" value={s.start} checked={slotStart === s.start} onChange={() => setSlotStart(s.start)} className={radio} required />
                      {fmtTime(s.start)}–{fmtTime(s.end)}
                    </label>
                  ))}
                </span>
              </div>
            ))}
          </fieldset>
        )}
        <FieldError name="slotStart" />
      </section>

      <section aria-labelledby="access" className="flex flex-col gap-3">
        <h2 id="access" className="text-lg font-semibold">
          3. Access
        </h2>
        {options.keyHolder ? <p className="text-sm">Key holder: {options.keyHolder}</p> : null}
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">How the partner gets in</legend>
          {options.accessMethods.map((a) => (
            <label key={a.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-card px-3 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
              <input type="radio" name="accessMethod" value={a.key} checked={accessMethod === a.key} onChange={() => setAccessMethod(a.key)} className={radio} required />
              <span>{a.label}</span>
            </label>
          ))}
        </fieldset>
        <FieldError name="accessMethod" />
        <Field label="Details" name="accessDetails" optional hint="e.g. “Key box by the back door; code sent separately”. Don’t write codes here.">
          <textarea id="accessDetails" name="accessDetails" className={`${textarea} min-h-16`} maxLength={1000} />
        </Field>
      </section>

      <section aria-labelledby="partner-notes">
        <h2 id="partner-notes" className="mb-3 text-lg font-semibold">
          4. Notes for the partner
        </h2>
        <Field label="Notes" name="notes" optional>
          <textarea id="notes" name="notes" className={textarea} maxLength={2000} />
        </Field>
      </section>

      <section aria-labelledby="review" className="rounded-2xl bg-soft p-5">
        <h2 id="review" className="mb-3 text-lg font-semibold">
          5. Review and approve
        </h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-[9rem_1fr]">
          <dt className="text-muted">Visit</dt>
          <dd>{pkg.name}</dd>
          <dt className="text-muted">Time</dt>
          <dd>{slot ? fmtSlot(slot.start, slot.end) : <span className="text-attention">Choose a time</span>}</dd>
          <dt className="text-muted">Access</dt>
          <dd>{access ? access.label : <span className="text-attention">Choose how the partner gets in</span>}</dd>
          <dt className="text-muted">Partner</dt>
          <dd>
            {options.partner.name}, {options.partner.area} <SimLabel>Fictional partner</SimLabel>
          </dd>
          <dt className="text-muted">Total</dt>
          <dd>
            <span className="font-semibold">{fmtMoney(pkg.totalCents)}</span> ({fmtMoney(pkg.partnerPriceCents)} to the partner + {fmtMoney(pkg.ifFeeCents)} If coordination
            fee)
          </dd>
        </dl>

        <div className="mt-4 flex flex-col gap-3">
          {options.canApprove ? (
            <>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="confirmAuthority" className={checkbox} required />
                <span>I can authorise access to this home for this visit</span>
              </label>
              <FieldError name="confirmAuthority" />
              <div>
                <SubmitButton pendingText="Booking…">Approve and book</SubmitButton>
              </div>
            </>
          ) : nobodyCanApprove ? (
            <>
              <p className="text-attention">
                Nobody in the family can approve visits yet. Ask the coordinator to give someone approval rights (Family page).
              </p>
              <div>
                <SubmitButton disabled>Send for approval</SubmitButton>
              </div>
            </>
          ) : (
            <>
              <p>Your request goes to {joinNames(options.authorisedMembers.map((m) => m.name))} for approval.</p>
              <div>
                <SubmitButton pendingText="Sending…">Send for approval</SubmitButton>
              </div>
            </>
          )}
          <p className="text-sm text-muted">Booking is simulated in this prototype. No payment is taken.</p>
        </div>
      </section>
    </ActionForm>
  );
}
