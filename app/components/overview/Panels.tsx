'use client';

import { useEffect, useRef, useState } from 'react';
import { getRatioStatus, type BudgetStatus } from '@/lib/statusColor';
import type { CategoryView, LoanView, TrendPoint, UpcomingBill } from './types';
import { CHIP_CLASS, STATUS_LABEL, money, money0, moneyK, ratioOf, splitCategory } from './format';
import { ProgressBar } from './ProgressBar';

export const PANEL = 'glass rounded-2xl p-5 md:p-6';

/* ---------- "October so far" ---------- */

type SummaryProps = {
  monthLong: string;
  income: number;
  spent: number;
  budget: number;
  pace: number | null;
  dayOfMonth: number;
  daysInMonth: number;
  watch: CategoryView[]; // categories at or past 85%
  onGoto: (category: string) => void;
  intro: boolean;
};

export function SummaryPanel({ monthLong, income, spent, budget, pace, dayOfMonth, daysInMonth, watch, onGoto, intro }: SummaryProps) {
  const ratio = ratioOf(spent, budget);
  const status = getRatioStatus(ratio);
  const hasIncome = income > 0;
  const net = income - spent;
  return (
    <section aria-labelledby="summary-title" className={PANEL}>
      <h2 id="summary-title" className="text-base font-semibold">{pace == null ? monthLong : `${monthLong} so far`}</h2>

      <div className="mt-[18px] grid grid-cols-[repeat(3,minmax(0,auto))] justify-start">
        <Figure label="Earned" value={hasIncome ? money0(income) : '—'} first />
        <Figure label="Spent" value={money0(spent)} />
        <Figure label={hasIncome && net < 0 ? 'Short' : 'Kept'} value={hasIncome ? (net < 0 ? '−' + money0(-net) : money0(net)) : '—'} />
      </div>
      {!hasIncome && <p className="mt-2 text-[13px] text-panel-inkMuted">No income is logged for this month yet.</p>}

      <div className="mt-6">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
          <b className="font-semibold">{budget > 0 ? `${Math.round(ratio * 100)}% of budget used` : 'No budget set'}</b>
          <span className="text-panel-inkMuted">{money0(spent)} of {money0(budget)}</span>
        </div>
        <ProgressBar ratio={ratio} status={status} pace={pace} intro={intro} className="mt-2.5" />
        {pace != null && (
          <p className="mt-2.5 flex items-center gap-2 text-[13px] text-panel-inkMuted">
            <i className="inline-block h-3.5 w-0.5 rounded bg-panel-ink" aria-hidden="true" />
            Today is day {dayOfMonth} of {daysInMonth}, so an even pace is {Math.round(pace * 100)}%.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-panel-line pt-[18px]">
        <h3 className="mb-1.5 text-sm font-semibold">Needs a look</h3>
        {watch.length === 0 ? (
          <p className="text-sm text-panel-inkMuted">Nothing is over or close to its budget.</p>
        ) : (
          <ul>
            {watch.map((c) => {
              const r = ratioOf(c.spent, c.budget);
              const s = getRatioStatus(r);
              const left = c.budget - c.spent;
              const { emoji, name } = splitCategory(c.category);
              return (
                <li key={c.category}>
                  <button
                    type="button"
                    onClick={() => onGoto(c.category)}
                    className="-mx-1.5 grid w-[calc(100%+12px)] grid-cols-[1fr_auto_82px] items-center gap-3 rounded-lg px-1.5 py-2 text-left text-[14.5px] hover:bg-panel-tint"
                  >
                    <span className="flex items-center gap-[9px] font-medium">
                      <span aria-hidden="true">{emoji}</span>
                      {name}
                    </span>
                    <Chip status={s} />
                    <span className={`text-right text-sm font-semibold ${s === 'over' ? 'text-status-over-ink' : ''}`}>
                      {s === 'over' ? `${money0(c.spent - c.budget)} over` : left < 0.5 ? 'Fully used' : `${money0(left)} left`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function Figure({ label, value, first = false }: { label: string; value: string; first?: boolean }) {
  return (
    <div className={`min-w-0 ${first ? 'pl-0 pr-3 sm:pr-[22px]' : 'border-l border-panel-line px-3 sm:px-[22px]'}`}>
      <span className="block text-[13px] text-panel-inkMuted">{label}</span>
      <b className="mt-0.5 block text-[clamp(1.35rem,3.4vw,1.85rem)] font-bold leading-[1.15] tracking-tight">{value}</b>
    </div>
  );
}

export function Chip({ status }: { status: BudgetStatus }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-[12.5px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current ${CHIP_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------- "Where it went" ---------- */

export function WherePanel({ rows, spent }: { rows: CategoryView[]; spent: number }) {
  const top = [...rows].filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 8);
  const rest = spent - top.reduce((t, r) => t + r.spent, 0);
  const share = (v: number) => (spent > 0 ? v / spent : 0);
  const items = [
    ...top.map((r) => ({ key: r.category, ...splitCategory(r.category), value: r.spent })),
    ...(rest > 0.5 ? [{ key: 'other', emoji: '', name: 'All other', value: rest }] : []),
  ];
  return (
    <section aria-labelledby="where-title" className={PANEL}>
      <h2 id="where-title" className="text-base font-semibold">Where it went</h2>
      <p className="mt-0.5 text-[13.5px] text-panel-inkMuted">Share of this month{'’'}s spending, excluding card payments.</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-panel-inkMuted">Nothing has been spent yet.</p>
      ) : (
        <ul className="mt-3.5 grid gap-3.5">
          {items.map((it) => (
            <li key={it.key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
              <span className="flex items-center gap-2">
                {it.emoji && <span aria-hidden="true">{it.emoji}</span>}
                {it.name}
              </span>
              <span className="font-semibold">
                {money0(it.value)}
                <small className="ml-1.5 text-[12.5px] font-normal text-panel-inkMuted">{Math.round(share(it.value) * 100)}%</small>
              </span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-panel-track" aria-hidden="true">
                <i className="block h-full rounded-full bg-gradient-to-r from-accent-strong to-status-debt-bar shadow-glow-accent" style={{ width: `${share(it.value) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- six-month chart ---------- */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, Math.min(640, Math.round(el.clientWidth))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function TrendPanel({ points, budget, income, intro }: { points: TrendPoint[]; budget: number; income: number; intro: boolean }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const H = W >= 560 ? 330 : 230, L = 4, R = 4, T = 14, B = 28;
  const ymax = Math.max(7000, Math.ceil(Math.max(budget, income, ...points.map((p) => p.total)) / 1000) * 1000 + 500);
  const y = (v: number) => T + (H - T - B) * (1 - v / ymax);
  const slot = (W - L - R) / points.length;
  const cw = Math.min(54, slot * 0.62);
  const gridSteps = Array.from({ length: Math.floor(ymax / 2000) + 1 }, (_, i) => i * 2000);

  return (
    <section aria-labelledby="trend-title" className={PANEL}>
      <h2 id="trend-title" className="text-base font-semibold">Last six months</h2>
      <p className="mt-0.5 text-[13.5px] text-panel-inkMuted">Total spending each month, against budget and income.</p>
      <div ref={ref} className="mt-3.5">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Spending for the last six months against a ${money0(budget)} budget and ${money0(income)} income`} className="block h-auto overflow-visible">
          <defs>
            <linearGradient id="trend-col" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          {gridSteps.map((v) => (
            <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--panel-line)" />
          ))}
          {income > 0 && <line x1={L} x2={W - R} y1={y(income)} y2={y(income)} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 4" />}
          {points.map((p, i) => {
            const x = L + slot * i + (slot - cw) / 2;
            const top = y(p.total);
            return (
              <g key={p.label + i}>
                <rect className={intro ? 'grow-y' : ''} x={x} y={top} width={cw} height={Math.max(y(0) - top, 0)} rx="5" fill={p.selected ? 'url(#trend-col)' : 'var(--panel-col)'} style={p.selected ? { filter: 'drop-shadow(0 0 9px rgba(59,130,246,0.55))' } : undefined}>
                  <title>{`${p.label}: ${money(p.total)}`}</title>
                </rect>
                {p.total > 0 && (
                  <text x={x + cw / 2} y={top + 20} textAnchor="middle" fontSize="12" fontWeight="600" fill={p.selected ? 'var(--accent-ink)' : 'var(--panel-ink)'}>{moneyK(p.total)}</text>
                )}
                <text x={x + cw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--panel-ink-muted)">{p.label}</text>
              </g>
            );
          })}
          {budget > 0 && <line x1={L} x2={W - R} y1={y(budget)} y2={y(budget)} stroke="var(--panel-ink)" strokeWidth="1.5" strokeDasharray="4 4" />}
        </svg>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-panel-inkMuted">
        <li className="inline-flex items-center gap-2"><i className="h-0 w-[22px] border-t-2 border-dashed border-panel-ink" aria-hidden="true" />Budget {money0(budget)}</li>
        {income > 0 && <li className="inline-flex items-center gap-2"><i className="h-0 w-[22px] border-t-2 border-dotted border-accent" aria-hidden="true" />Income {money0(income)}</li>}
      </ul>
    </section>
  );
}

/* ---------- coming up + loans ---------- */

export function UpcomingPanel({ bills, windowDays }: { bills: UpcomingBill[]; windowDays: number }) {
  const total = bills.reduce((t, b) => t + b.amount, 0);
  return (
    <section aria-labelledby="upcoming-title" className={PANEL}>
      <h2 id="upcoming-title" className="text-base font-semibold">Coming up</h2>
      <p className="mt-0.5 text-[13.5px] text-panel-inkMuted">Recurring bills due in the next {windowDays} days.</p>
      {bills.length === 0 ? (
        <p className="mt-3 text-sm text-panel-inkMuted">Nothing is due in the next {windowDays} days.</p>
      ) : (
        <>
          <ul className="mt-3">
            {bills.map((b, i) => (
              <li key={b.name + i} className="grid grid-cols-[60px_1fr_auto] items-baseline gap-2 border-t border-panel-lineSoft py-2.5 text-[14.5px] first:border-t-0">
                <span className="text-[13.5px] text-panel-inkMuted">{b.dayLabel}</span>
                <span className="min-w-0 truncate">{b.name}</span>
                <span className="font-semibold">{money(b.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex justify-between border-t border-panel-line pt-3 text-sm text-panel-inkMuted">
            <span>Total due</span>
            <b className="font-semibold text-panel-ink">{money(total)}</b>
          </div>
        </>
      )}
    </section>
  );
}

export function LoansPanel({ loans, intro }: { loans: LoanView[]; intro: boolean }) {
  return (
    <section aria-labelledby="loans-title" className={PANEL}>
      <h2 id="loans-title" className="text-base font-semibold">Loans</h2>
      <p className="mt-0.5 text-[13.5px] text-panel-inkMuted">Kept apart from the monthly budget.</p>
      {loans.length === 0 ? (
        <p className="mt-3 text-sm text-panel-inkMuted">No loans configured yet.</p>
      ) : (
        <ul className="mt-3.5 grid gap-[18px]">
          {loans.map((l) => {
            const paid = Math.max(l.principal - l.balance, 0);
            const ratio = l.principal > 0 ? paid / l.principal : 0;
            return (
              <li key={l.name}>
                <div className="flex justify-between gap-3 text-[14.5px]">
                  <b className="font-semibold">{l.name}</b>
                  <span className="text-panel-inkMuted">{money0(paid)} of {money0(l.principal)}</span>
                </div>
                <ProgressBar ratio={ratio} status="debt" size="sm" intro={intro} className="mt-2" />
                <small className="mt-1.5 block text-[13px] text-panel-inkMuted">
                  {money0(l.balance)} to go
                  {l.payment > 0 && `, paying ${money0(l.payment)} ${l.frequency.toLowerCase()}`}
                  {l.payoffLabel && `, est. payoff ${l.payoffLabel}`}.
                </small>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
