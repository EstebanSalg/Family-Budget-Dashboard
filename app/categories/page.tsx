import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getSixMonthTrend } from '@/lib/sheets/monthlyTrend';
import { CategoryRow } from '../components/CategoryRow';
import { AddCategoryForm } from '../components/AddCategoryForm';
import { MonthSelector } from '../components/MonthSelector';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const [rows, selectedMonth, transactions] = await Promise.all([
    getCategoryBudgets(),
    getSelectedMonth(),
    getTransactions(),
  ]);
  const now = new Date();

  return (
    <main className="min-h-screen space-y-5 bg-panel-bg p-6 text-panel-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Categories</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-panel-inkMuted">
            {rows.length} tracked · brass tick = budget line
          </p>
        </div>
        <MonthSelector currentMonth={selectedMonth} />
      </div>

      <AddCategoryForm />

      <div className="rounded-lg border border-panel-line bg-panel-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.4),0_14px_30px_-16px_rgba(0,0,0,.65)]">
        <div className="flex items-center justify-between border-b border-panel-line pb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-panel-inkMuted">
          <span>Category</span>
          <div className="flex items-center gap-5">
            <span className="w-20 text-right">Spent</span>
            <span className="w-24 text-right">Budget</span>
            <span className="w-14 whitespace-nowrap text-right">% Used</span>
            <span className="w-[70px] text-right">Status</span>
            <span className="w-[72px] text-right">6 Mo</span>
          </div>
        </div>
        {rows.map((row) => (
          <CategoryRow key={row.category} row={row} trend={getSixMonthTrend(transactions, row.category, now)} />
        ))}
      </div>
    </main>
  );
}
