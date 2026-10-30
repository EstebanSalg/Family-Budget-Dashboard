import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getRecurringItems } from '@/lib/sheets/recurring';
import { estimatePayoffDate, getDebts } from '@/lib/sheets/debts';
import { getLatestEntriesByCategory, getSixMonthTotals } from '@/lib/sheets/monthlyTotals';
import { MONTH_LABELS, MONTH_NAMES } from '@/lib/sheets/months';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import type { CategoryView, OverviewData } from './components/overview/types';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

const INCOME_CATEGORY = '💰 Income';
// Credit Cards keeps its own budget/spent row (so it's still trackable on its
// own) but is excluded from the household's overall totals: a card bill
// payment is money already counted once as an itemized purchase (Amex, etc.)
// under its real category. Including it too would double-count whatever was
// charged to the card.
const CARDS_CATEGORY = '💳 Credit Cards';
const UPCOMING_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// The recurring and loan tabs feed side panels only; if either can't be read,
// the budget itself should still load.
async function orEmpty<T>(label: string, load: Promise<T[]>): Promise<T[]> {
  try {
    return await load;
  } catch (err) {
    console.error(`Overview: could not load ${label}`, err);
    return [];
  }
}

export default async function OverviewPage() {
  const [budgets, selectedMonth, transactions, recurring, debts] = await Promise.all([
    getCategoryBudgets(),
    getSelectedMonth(),
    getTransactions(),
    orEmpty('recurring items', getRecurringItems()),
    orEmpty('loans', getDebts()),
  ]);

  // The sheet's month selector holds a month name only, not a year. Treat it as
  // the most recent occurrence of that month (so selecting a later month than
  // today's means last year).
  const now = new Date();
  const foundIndex = (MONTH_NAMES as readonly string[]).indexOf(selectedMonth);
  const monthIndex = foundIndex === -1 ? now.getMonth() : foundIndex;
  const year = monthIndex > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
  const closed = monthIndex !== now.getMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const monthShort = MONTH_NAMES[monthIndex];
  const monthLong = MONTH_LABELS[monthShort];

  const entries = getLatestEntriesByCategory(transactions, monthKey, 5);
  const toView = (b: { category: string; budget: number; spent: number }): CategoryView => ({
    category: b.category,
    budget: b.budget,
    spent: b.spent,
    entries: entries[b.category] ?? [],
  });

  const trend = getSixMonthTotals(transactions, new Date(Date.UTC(year, monthIndex, 1)), [INCOME_CATEGORY, CARDS_CATEGORY]).map((point, i, all) => ({
    label: MONTH_NAMES[Number(point.month.slice(5)) - 1],
    total: point.total,
    selected: i === all.length - 1,
  }));

  const dateFmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = recurring
    .filter((r) => r.nextDueDate.getTime() >= startOfToday && r.nextDueDate.getTime() <= startOfToday + UPCOMING_WINDOW_DAYS * DAY_MS)
    .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
    .map((r) => ({ name: r.name, amount: r.expectedAmount, dayLabel: `${dateFmt(r.nextDueDate, { weekday: 'short' })} ${r.nextDueDate.getUTCDate()}` }));

  const loans = debts.map((d) => {
    const payoff = estimatePayoffDate(d);
    return {
      name: d.name,
      principal: d.principal,
      balance: d.currentBalance,
      payment: d.payment,
      frequency: d.frequency,
      payoffLabel: payoff ? dateFmt(payoff, { month: 'short', year: 'numeric' }) : null,
    };
  });

  const cardsRow = budgets.find((b) => b.category === CARDS_CATEGORY);
  const data: OverviewData = {
    monthName: selectedMonth,
    monthLabel: `${monthLong} ${year}`,
    monthLong,
    entryMonthShort: monthShort,
    daysInMonth,
    dayOfMonth: closed ? daysInMonth : now.getDate(),
    closed,
    income: budgets.find((b) => b.category === INCOME_CATEGORY)?.spent ?? 0,
    categories: budgets.filter((b) => b.category !== INCOME_CATEGORY && b.category !== CARDS_CATEGORY).map(toView),
    cards: cardsRow ? toView(cardsRow) : null,
    trend,
    upcoming,
    upcomingWindowDays: UPCOMING_WINDOW_DAYS,
    loans,
  };

  return <OverviewDashboard data={data} />;
}
