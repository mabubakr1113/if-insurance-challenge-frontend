'use client';

import { useState, type ReactNode } from 'react';
import type { FormAction } from '@/lib/action-state';
import type { BookingOptions, PackageKey } from '@/lib/contract';
import { fmtDate, fmtMoney, fmtSlot, fmtTime, helsinkiYmd } from '@/lib/format';
import { joinNames } from '@/lib/labels';
import { ActionForm, FieldError, FormMessage, InvalidWrap, SubmitButton } from './forms';
import { checkbox, eyebrow, listBox, mainCol, railCol, row, textarea, twoCol } from './styles';
import { Card, SimLabel } from './ui';

/** P17: visit type, time and access in the main column; the summary, approval and total in the sticky rail. */
export function BookingForm({
  options,
  action,
  defaultPackage,
  taskChip,
  railExtra,
}: {
  options: BookingOptions;
  action: FormAction;
  defaultPackage: PackageKey;
  taskChip?: ReactNode;
  railExtra?: ReactNode;
}) {
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
    <ActionForm action={action} className={`${twoCol} gap-7`} showMessage={false}>
      <div className={`${mainCol} gap-[26px]`}>
        {taskChip}

        <section aria-labelledby="choose-visit" className="flex flex-col gap-2.5">
          <h2 id="choose-visit" className={eyebrow}>
            1 · Visit type
          </h2>
          <div role="radiogroup" aria-labelledby="choose-visit" className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))]">
            {options.packages.map((p) => {
              const on = p.key === packageKey;
              return (
                <label
                  key={p.key}
                  className={`flex cursor-pointer flex-col gap-2 rounded-[14px] border-[1.5px] p-4 text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                    on ? 'border-ink bg-selected' : 'border-line bg-card hover:border-line-hover'
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-[15px] font-bold">{p.name}</span>
                    <input
                      type="radio"
                      name="packageKey"
                      value={p.key}
                      checked={on}
                      onChange={() => {
                        setPackageKey(p.key);
                        setSlotStart('');
                      }}
                      className="hw-radio focus-visible:outline-none"
                    />
                  </span>
                  <span className="text-xs text-muted">
                    {p.durationMin} min · {p.leadTime}
                  </span>
                  <span className="font-display text-[26px] leading-none">{fmtMoney(p.totalCents)}</span>
                  {on ? (
                    <span className="flex flex-col gap-0.5 border-t border-line-soft pt-1.5">
                      {p.includes.map((i) => (
                        <span key={i} className="text-xs text-ink-soft">
                          {i}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          <FieldError name="packageKey" />
        </section>

        <section aria-labelledby="choose-time" className="flex flex-col gap-2.5">
          <h2 id="choose-time" className={eyebrow}>
            2 · Time
          </h2>
          {slots.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line-input px-4 py-5 text-sm text-muted">
              No times left for this visit in the next 3 days. The urgent check may still have one.
            </p>
          ) : (
            <InvalidWrap name="slotStart">
              <fieldset className={listBox}>
                <legend className="sr-only">Times for the {pkg.name.toLowerCase()}</legend>
                {[...days.entries()].map(([day, list]) => (
                  <div key={day} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${row}`}>
                    <span className="w-[130px] text-sm font-semibold">{fmtDate(day)}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {list.map((s) => {
                        const on = slotStart === s.start;
                        return (
                          <label
                            key={s.start}
                            className={`relative flex h-[34px] cursor-pointer items-center rounded-lg border px-3 text-[13px] font-semibold select-none ${
                              on ? 'border-ink bg-ink text-white' : 'border-line-input bg-white text-ink hover:bg-hover-btn'
                            }`}
                          >
                            <input type="radio" name="slotStart" value={s.start} checked={on} onChange={() => setSlotStart(s.start)} className="hw-peer" />
                            {fmtTime(s.start)}–{fmtTime(s.end)}
                          </label>
                        );
                      })}
                    </span>
                  </div>
                ))}
              </fieldset>
            </InvalidWrap>
          )}
          <FieldError name="slotStart" />
        </section>

        <section aria-labelledby="access" className="flex flex-col gap-2.5">
          <h2 id="access" className={eyebrow}>
            3 · Access
          </h2>
          <fieldset className={listBox}>
            <legend className="sr-only">How the partner gets in</legend>
            {options.accessMethods.map((a) => {
              const on = accessMethod === a.key;
              return (
                <label key={a.key} className={`flex cursor-pointer items-center gap-3 px-4 py-[13px] text-sm ${row} ${on ? 'bg-selected' : 'hover:bg-hover'}`}>
                  <input type="radio" name="accessMethod" value={a.key} checked={on} onChange={() => setAccessMethod(a.key)} className="hw-radio" />
                  {a.label}
                </label>
              );
            })}
          </fieldset>
          {options.keyHolder ? <span className="text-[13px] text-muted">Key holder: {options.keyHolder}</span> : null}
          <FieldError name="accessMethod" />
          <label htmlFor="notes" className="sr-only">
            Notes for the partner
          </label>
          <textarea id="notes" name="notes" className={`${textarea} min-h-[70px]`} maxLength={2000} placeholder="Notes for the partner (optional). Don’t write codes here." />
        </section>
      </div>

      <aside aria-label="Summary" className={railCol}>
        <Card className="gap-3.5">
          <h2 className="text-sm font-semibold">Summary</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted">Visit</dt>
              <dd className="text-right">{pkg.name}</dd>
            </div>
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted">Time</dt>
              <dd className={`text-right ${slot ? '' : 'text-attention'}`}>{slot ? fmtSlot(slot.start, slot.end) : 'Choose a time'}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Access</dt>
              <dd className={access ? '' : 'text-attention'}>{access ? access.label : 'Choose how the partner gets in'}</dd>
            </div>
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted">Partner</dt>
              <dd className="flex flex-col items-end gap-1 text-right">
                {options.partner.name}
                <SimLabel>Fictional partner</SimLabel>
              </dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between border-t border-line-soft pt-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-display text-[28px]">{fmtMoney(pkg.totalCents)}</span>
          </div>
          <span className="-mt-2 text-xs text-muted">
            {fmtMoney(pkg.partnerPriceCents)} to the partner + {fmtMoney(pkg.ifFeeCents)} If coordination fee
          </span>

          {options.canApprove ? (
            <div className="flex flex-col gap-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.4]">
                <input type="checkbox" name="confirmAuthority" className={`${checkbox} hw-check-sm`} />I can authorise access to this home for this visit
              </label>
              <FieldError name="confirmAuthority" className="text-xs" />
            </div>
          ) : nobodyCanApprove ? (
            <span className="text-[13px] text-attention">Nobody in the family can approve visits yet. Ask the coordinator to give someone approval rights on the Family page.</span>
          ) : (
            <span className="text-[13px]">Your request goes to {joinNames(options.authorisedMembers.map((m) => m.name))} for approval.</span>
          )}

          <FormMessage className="" />
          <SubmitButton block size="lg" disabled={nobodyCanApprove} pendingText={options.canApprove ? 'Booking…' : 'Sending…'}>
            {options.canApprove ? 'Approve and book' : 'Send for approval'}
          </SubmitButton>
          <span className="text-center text-xs text-muted">Prototype price, not a quote. No payment is taken.</span>
        </Card>
        {railExtra}
      </aside>
    </ActionForm>
  );
}
