'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRatioStatus } from '@/lib/statusColor';
import { MonthSelector } from '../MonthSelector';
import { CategoryTable, type Filter, type Sort } from './CategoryTable';
import { LoansPanel, PANEL, SummaryPanel, TrendPanel, UpcomingPanel, WherePanel } from './Panels';
import { DOT_CLASS, list, money, money0, ratioOf, splitCategory } from './format';
import type { CategoryView, OverviewData } from './types';

export function OverviewDashboard({ data }: { data: OverviewData }) {
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('used');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const [intro, setIntro] = useState(true);

  // Bars and columns grow in once on load, then stay put on later re-renders.
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // New server data (month change or refresh) already contains saved budgets,
  // so drop the local optimistic overrides and any open row.
  useEffect(() => {
    setBudgets({});
    setOpen(null);
    setSaveError(null);
  }, [data]);

  const withBudget = useCallback((c: CategoryView): CategoryView => ({ ...c, budget: budgets[c.category] ?? c.budget }), [budgets]);
  const rows = useMemo(() => data.categories.map(withBudget), [data.categories, withBudget]);
  const cards = data.cards ? withBudget(data.cards) : null;

  const spent = rows.reduce((t, r) => t + r.spent, 0);
  const budget = rows.reduce((t, r) => t + r.budget, 0);
  const income = data.income;
  const net = income - spent;
  const ratio = ratioOf(spent, budget);
  const pace = data.closed ? null : data.dayOfMonth / data.daysInMonth;

  const overs = rows.filter((r) => ratioOf(r.spent, r.budget) > 1).map((r) => splitCategory(r.category).name);
  const close = rows.filter((r) => getRatioStatus(ratioOf(r.spent, r.budget)) === 'warn').map((r) => splitCategory(r.category).name);
  const watch = rows.filter((r) => ratioOf(r.spent, r.budget) > 0.85).sort((a, b) => ratioOf(b.spent, b.budget) - ratioOf(a.spent, a.budget));

  let headline: string;
  let dot: 'ok' | 'warn' | 'over';
  if (data.closed) {
    const bad = (income > 0 && net < 0) || ratio > 1;
    headline = bad ? `${data.monthLong} closed over budget` : `${data.monthLong} closed in the green`;
    dot = bad ? 'over' : 'ok';
  } else if (income > 0 && net < 0) {
    headline = 'We are spending more than we earn';
    dot = 'over';
  } else if (overs.length >= 3) {
    headline = 'Several categories are over budget';
    dot = 'over';
  } else if (pace != null && ratio <= pace + 0.02) {
    headline = 'We’re on track this month';
    dot = overs.length ? 'warn' : 'ok';
  } else {
    headline = 'Spending is running a little hot';
    dot = 'warn';
  }

  const leftover = budget - spent;

  const baseBudget = (category: string) => [...data.categories, ...(data.cards ? [data.cards] : [])].find((c) => c.category === category)?.budget ?? 0;

  const handleBudgetChange = useCallback(
    async (category: string, value: number) => {
      const previous = budgets[category] ?? baseBudget(category);
      setBudgets((b) => ({ ...b, [category]: value }));
      setSaveError(null);
      try {
        const res = await fetch(`/api/categories/${encodeURIComponent(category)}/budget`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: value }),
        });
        if (!res.ok) throw new Error('save failed');
      } catch {
        setBudgets((b) => ({ ...b, [category]: previous }));
        setSaveError('Could not save to the sheet, so the change was reverted.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [budgets, data]
  );

  const handleOpen = (category: string | null) => {
    setSaveError(null);
    setOpen(category);
  };

  const goto = (category: string) => {
    setFilter('all');
    setOpen(category);
    setPendingScroll(category);
  };

  useEffect(() => {
    if (!pendingScroll || open !== pendingScroll) return;
    const index = data.categories.findIndex((c) => c.category === pendingScroll);
    const li = document.getElementById(`cat-row-${index}`);
    li?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    li?.querySelector('button')?.focus({ preventScroll: true });
    setPendingScroll(null);
  }, [pendingScroll, open, data.categories]);

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-[18px] md:px-8 md:pb-16 md:pt-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-[clamp(1.6rem,4.6vw,2.15rem)] font-semibold leading-[1.15] tracking-tight text-balance">
            <span className={`h-3 w-3 shrink-0 rounded-full ${DOT_CLASS[dot]}`} aria-hidden="true" />
            {headline}
          </h1>
          <p className="mt-2 max-w-[62ch] text-base text-panel-inkMuted text-pretty">
            <strong className="font-semibold text-panel-ink">{money(Math.abs(leftover))}</strong>{' '}
            {leftover >= 0
              ? `of the ${money0(budget)} budget ${data.closed ? 'was left over' : 'is still unspent'}`
              : `over the ${money0(budget)} budget`}
            {!data.closed && `, with ${data.daysInMonth - data.dayOfMonth} days to go`}.
            {overs.length > 0 && ` ${list(overs)} ${overs.length > 1 ? 'are' : 'is'} over.`}
            {close.length > 0 && ` ${list(close)} ${close.length > 1 ? 'are' : 'is'} close.`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <MonthSelector currentMonth={data.monthName} />
          <span className="rounded-full border border-accent-line bg-accent-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-accent">
            {data.closed ? `Closed ${data.monthLabel}` : 'Current month'}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:mt-7 lg:grid-cols-12 lg:gap-5">
        <div className="min-w-0 lg:col-span-7">
          <SummaryPanel
            monthLong={data.monthLong}
            income={income}
            spent={spent}
            budget={budget}
            pace={pace}
            dayOfMonth={data.dayOfMonth}
            daysInMonth={data.daysInMonth}
            watch={watch}
            onGoto={goto}
            intro={intro}
          />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <WherePanel rows={rows} spent={spent} />
        </div>

        <section aria-labelledby="categories-title" className={`${PANEL} min-w-0 lg:col-span-12`}>
          <CategoryTable
            rows={rows}
            open={open}
            onOpen={handleOpen}
            filter={filter}
            onFilter={setFilter}
            sort={sort}
            onSort={setSort}
            pace={pace}
            entryMonth={data.entryMonthShort}
            monthLong={data.monthLong}
            intro={intro}
            saveError={saveError}
            onBudgetChange={handleBudgetChange}
          />
          {cards && (
            <p className="mt-4 border-t border-panel-lineSoft pt-3.5 text-[13px] text-panel-inkMuted">
              Credit Cards ({money0(cards.spent)} of {money0(cards.budget)}) is tracked on its own and kept out of these totals, because a card payment is already counted under the category it was spent in.
            </p>
          )}
        </section>

        <div className="min-w-0 lg:col-span-7">
          <TrendPanel points={data.trend} budget={budget} income={income} intro={intro} />
        </div>
        <div className="grid min-w-0 content-start gap-4 lg:col-span-5 lg:gap-5">
          <UpcomingPanel bills={data.upcoming} windowDays={data.upcomingWindowDays} />
          <LoansPanel loans={data.loans} intro={intro} />
        </div>
      </div>

      <p className="mt-10 text-[13px] text-panel-faint">
        Numbers missing or stale? <Link href="/reconnect" className="underline underline-offset-2 hover:text-accent">Reconnect Google</Link>.
      </p>
    </main>
  );
}
