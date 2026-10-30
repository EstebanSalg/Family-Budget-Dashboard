'use client';

import { useEffect, useState } from 'react';
import { getRatioStatus } from '@/lib/statusColor';
import type { CategoryView } from './types';
import { CHIP_CLASS, STATUS_LABEL, money, money0, ratioOf, splitCategory } from './format';
import { ProgressBar } from './ProgressBar';

export type Filter = 'all' | 'over' | 'warn' | 'ok';
export type Sort = 'used' | 'sheet';

type Props = {
  rows: CategoryView[]; // already carries any edited budgets
  open: string | null;
  onOpen: (category: string | null) => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
  sort: Sort;
  onSort: (s: Sort) => void;
  pace: number | null;
  entryMonth: string; // "Oct"
  monthLong: string;
  intro: boolean;
  saveError: string | null;
  onBudgetChange: (category: string, value: number) => void;
};

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['over', 'Over'],
  ['warn', 'Close'],
  ['ok', 'On track'],
];

const GRID = 'min-[900px]:grid-cols-[minmax(150px,1.3fr)_92px_92px_minmax(180px,1.7fr)_104px_96px] min-[900px]:gap-x-[18px]';

export function CategoryTable({ rows, open, onOpen, filter, onFilter, sort, onSort, pace, entryMonth, monthLong, intro, saveError, onBudgetChange }: Props) {
  const statusOf = (r: CategoryView) => getRatioStatus(ratioOf(r.spent, r.budget));
  const counts: Record<Filter, number> = {
    all: rows.length,
    over: rows.filter((r) => statusOf(r) === 'over').length,
    warn: rows.filter((r) => statusOf(r) === 'warn').length,
    ok: rows.filter((r) => statusOf(r) === 'ok').length,
  };

  let shown = rows.map((r, index) => ({ r, index })).filter(({ r }) => filter === 'all' || statusOf(r) === filter);
  if (sort === 'used') shown = [...shown].sort((a, b) => ratioOf(b.r.spent, b.r.budget) - ratioOf(a.r.spent, a.r.budget));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h2 id="categories-title" className="text-base font-semibold">Budget by category</h2>
          <p className="mt-0.5 text-[13.5px] text-panel-inkMuted">Tap a row for entries and to change its budget.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div role="group" aria-label="Filter categories" className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[9px] border border-panel-line bg-panel-tint p-[3px]">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => onFilter(key)}
                className="h-[30px] whitespace-nowrap rounded-lg px-[11px] text-[13.5px] font-semibold text-panel-inkMuted aria-pressed:bg-accent-soft aria-pressed:text-accent aria-pressed:ring-1 aria-pressed:ring-inset aria-pressed:ring-accent-line"
              >
                {label}
                <span className="ml-1.5 font-normal text-panel-faint">{counts[key]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onSort(sort === 'used' ? 'sheet' : 'used')}
            className="inline-flex h-9 items-center gap-[7px] rounded-[9px] border border-panel-line px-3 text-[13.5px] font-medium text-panel-inkMuted hover:bg-panel-tint hover:text-panel-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px]" aria-hidden="true">
              <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
            </svg>
            {sort === 'used' ? 'Most used first' : 'Sheet order'}
          </button>
        </div>
      </div>

      <div aria-hidden="true" className={`mx-[-8px] mt-[18px] hidden border-b border-panel-line px-2 pb-2 text-[12.5px] font-medium text-panel-faint min-[900px]:grid ${GRID}`}>
        <span>Category</span>
        <span className="text-right">Spent</span>
        <span className="text-right">Budget</span>
        <span>Used</span>
        <span className="text-right">Left</span>
        <span />
      </div>

      <ul className="-mx-2 mt-3.5 min-[900px]:mt-0">
        {shown.length === 0 && <li className="px-2 py-[18px] text-sm text-panel-inkMuted">Nothing here this month.</li>}
        {shown.map(({ r, index }) => {
          const ratio = ratioOf(r.spent, r.budget);
          const status = getRatioStatus(ratio);
          const left = r.budget - r.spent;
          const { emoji, name } = splitCategory(r.category);
          const isOpen = open === r.category;
          const pct = r.budget > 0 ? `${Math.round(ratio * 100)}%` : '—';
          const leftText = status === 'over' ? `−${money0(r.spent - r.budget)}` : money0(left);
          const summary =
            status === 'over' ? `${money(r.spent - r.budget)} over` : r.spent === 0 ? 'nothing spent yet' : left < 0.5 ? 'fully used' : `${money(left)} left`;
          return (
            <li key={r.category} id={`cat-row-${index}`} className="scroll-mt-24 border-t border-panel-lineSoft first:border-t-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={`${name}: ${money(r.spent)} of ${money(r.budget)}, ${STATUS_LABEL[status].toLowerCase()}`}
                onClick={() => onOpen(isOpen ? null : r.category)}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-[10px] px-2 py-3.5 text-left transition-colors hover:bg-panel-tint aria-expanded:bg-panel-tint min-[900px]:py-3 ${GRID}`}
              >
                <span className="flex items-center gap-2.5 font-medium min-[900px]:col-start-1 min-[900px]:row-start-1">
                  <span aria-hidden="true" className="w-[22px] text-center text-lg leading-none">{emoji}</span>
                  {name}
                </span>
                <span className="hidden text-right font-semibold min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:block">{money0(r.spent)}</span>
                <span className="hidden text-right text-panel-inkMuted min-[900px]:col-start-3 min-[900px]:row-start-1 min-[900px]:block">{money0(r.budget)}</span>
                <span className="col-span-2 flex items-center gap-3 min-[900px]:col-span-1 min-[900px]:col-start-4 min-[900px]:row-start-1">
                  <ProgressBar ratio={ratio} status={status} pace={pace} size="sm" intro={intro} className="flex-1" />
                  <span className={`w-10 text-right text-[13px] font-semibold ${status === 'over' ? 'text-status-over-ink' : ''}`}>{pct}</span>
                </span>
                <span className={`hidden text-right min-[900px]:col-start-5 min-[900px]:row-start-1 min-[900px]:block ${status === 'over' ? 'font-semibold text-status-over-ink' : ''}`}>{leftText}</span>
                <span className="col-span-2 text-[13.5px] text-panel-inkMuted min-[900px]:hidden">
                  <b className="font-semibold text-panel-ink">{money0(r.spent)}</b> of {money0(r.budget)} {'·'} {summary}
                </span>
                <span className={`col-start-2 row-start-1 inline-flex h-6 items-center gap-1.5 justify-self-end whitespace-nowrap rounded-full px-[9px] text-[12.5px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current min-[900px]:col-start-6 ${CHIP_CLASS[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </button>
              {isOpen && (
                <CategoryDetail
                  row={r}
                  status={status}
                  pace={pace}
                  entryMonth={entryMonth}
                  monthLong={monthLong}
                  saveError={saveError}
                  onClose={() => onOpen(null)}
                  onBudgetChange={onBudgetChange}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryDetail({
  row, status, pace, entryMonth, monthLong, saveError, onClose, onBudgetChange,
}: {
  row: CategoryView;
  status: ReturnType<typeof getRatioStatus>;
  pace: number | null;
  entryMonth: string;
  monthLong: string;
  saveError: string | null;
  onClose: () => void;
  onBudgetChange: (category: string, value: number) => void;
}) {
  const { emoji, name } = splitCategory(row.category);
  const [draft, setDraft] = useState(String(row.budget));
  useEffect(() => setDraft(String(row.budget)), [row.budget]);

  const commit = (value: number) => {
    if (Number.isFinite(value) && value >= 0 && value !== row.budget) onBudgetChange(row.category, value);
    else setDraft(String(row.budget));
  };
  const left = row.budget - row.spent;
  const expected = pace != null ? row.budget * pace : null;

  return (
    <div id="category-detail" className="slide-in mx-2 mb-3.5 mt-0.5 rounded-xl border border-panel-lineSoft bg-panel-tint px-5 py-[18px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[17px] font-semibold">{emoji} {name}</h3>
        <button type="button" onClick={onClose} aria-label="Close details" className="grid h-[34px] w-[34px] place-items-center rounded-lg text-panel-inkMuted hover:bg-panel-lineSoft hover:text-panel-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-[17px] w-[17px]" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <p className="mt-1 text-[15px]" aria-live="polite">
        <b className="font-semibold">{money(row.spent)}</b> spent of {money(row.budget)}.{' '}
        {status === 'over' ? <b className="font-semibold">{money(row.spent - row.budget)} over.</b> : row.spent === 0 ? 'Nothing logged yet.' : left < 0.5 ? 'Fully used.' : `${money(left)} left.`}
      </p>
      {expected != null && (
        <p className="mt-0.5 text-sm text-panel-inkMuted">
          At this point in {monthLong}, an even pace would be about {money0(expected)}. We are {row.spent > expected ? 'ahead of' : 'under'} that.
        </p>
      )}

      <div className="mt-4 grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
        <div>
          <label htmlFor="budget-input" className="mb-2 block text-[13px] font-medium text-panel-inkMuted">Monthly budget</label>
          <div className="inline-flex items-center rounded-[10px] border border-panel-line bg-panel-surface">
            <button type="button" aria-label="Lower budget by $25" onClick={() => commit(Math.max(0, row.budget - 25))} className="grid h-[42px] w-[42px] place-items-center rounded-[9px] hover:bg-panel-tint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M5 12h14" /></svg>
            </button>
            <span className="flex items-center text-lg font-bold">
              <span aria-hidden="true">$</span>
              <input
                id="budget-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={25}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={(e) => commit(Number(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-[78px] bg-transparent text-center text-lg font-bold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </span>
            <button type="button" aria-label="Raise budget by $25" onClick={() => commit(row.budget + 25)} className="grid h-[42px] w-[42px] place-items-center rounded-[9px] hover:bg-panel-tint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-panel-faint">Saved to the sheet. Type an amount or step by $25.</p>
          {saveError && <p role="alert" className="mt-1.5 text-[13px] text-status-over-ink">{saveError}</p>}
        </div>
        <div>
          <span className="mb-2 block text-[13px] font-medium text-panel-inkMuted">Latest entries</span>
          {row.entries.length === 0 ? (
            <p className="text-sm text-panel-inkMuted">Nothing logged in {monthLong} yet.</p>
          ) : (
            <ul>
              {row.entries.map((e, i) => (
                <li key={i} className="grid grid-cols-[56px_1fr_auto] gap-2.5 border-t border-panel-line py-2 text-[14.5px] first:border-t-0 first:pt-0">
                  <span className="text-panel-inkMuted">{entryMonth} {e.day}</span>
                  <span className="min-w-0 truncate">{e.description}</span>
                  <span className="font-semibold">{money(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
