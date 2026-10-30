import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getSixMonthTrend } from '@/lib/sheets/monthlyTrend';
import { CategoryRow } from '../components/CategoryRow';
import { AddCategoryForm } from '../components/AddCategoryForm';
import { MonthSelector } from '../components/MonthSelector';
import { PAGE, PANEL, PageHeader } from '../components/ui';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const [allRows, selectedMonth, transactions] = await Promise.all([
    getCategoryBudgets(),
    getSelectedMonth(),
    getTransactions(),
  ]);
  const now = new Date();
  // Income already has its own figure on the Overview page -- it doesn't need
  // a budget/spent row here too.
  const rows = allRows.filter((b) => b.category !== '💰 Income');

  return (
    <main className={`${PAGE} space-y-5`}>
      <PageHeader title="Categories" subtitle={`${rows.length} tracked. Tap a budget to change it, or a name for its details.`}>
        <MonthSelector currentMonth={selectedMonth} />
      </PageHeader>

      <AddCategoryForm />

      <div className={PANEL}>
        <div className="mb-1 hidden items-center justify-between border-b border-panel-line pb-2 text-[12.5px] font-medium text-panel-faint md:flex">
          <span>Category</span>
          <div className="flex items-center gap-4">
            <span className="w-20 text-right">Spent</span>
            <span className="w-24 text-right">Budget</span>
            <span className="w-12 text-right">Used</span>
            <span className="w-[88px] text-center">Status</span>
            <span className="w-[72px] text-right">6 months</span>
          </div>
        </div>
        {rows.map((row) => (
          <CategoryRow key={row.category} row={row} trend={getSixMonthTrend(transactions, row.category, now)} />
        ))}
      </div>
    </main>
  );
}
