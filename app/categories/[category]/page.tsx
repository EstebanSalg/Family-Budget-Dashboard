import Link from 'next/link';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { getSixMonthTrend } from '@/lib/sheets/monthlyTrend';
import { CategoryTrendChart } from '../../components/CategoryTrendChart';
import { TransactionSearch } from '../../components/TransactionSearch';

export default async function CategoryDetailPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const [transactions, budgets, selectedMonth] = await Promise.all([
    getTransactions(),
    getCategoryBudgets(),
    getSelectedMonth(),
  ]);

  const budgetRow = budgets.find((b) => b.category === category);
  // Scoped to the same month selected on Overview/Categories -- matches the
  // "Spent" figure above it (also month-scoped, not year, per the sheet's
  // own SUMPRODUCT convention). The 6-month trend chart below intentionally
  // stays a trailing 6-month view regardless of the selected month.
  const categoryTransactions = transactions
    .filter((t) => t.category === category && t.month === selectedMonth)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const trend = getSixMonthTrend(transactions, category, new Date());

  return (
    <main className="min-h-screen space-y-6 bg-panel-bg p-6 text-panel-ink">
      <Link href="/categories" className="inline-flex items-center gap-1 text-sm text-panel-inkMuted hover:text-accent hover:underline">
        ← Categories
      </Link>
      <h1 className="text-2xl font-semibold">{category}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-panel-line bg-panel-surface p-4">
          <p className="text-xs uppercase text-panel-inkMuted">Spent</p>
          <p className="font-mono text-xl font-semibold">${(budgetRow?.spent ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-panel-line bg-panel-surface p-4">
          <p className="text-xs uppercase text-panel-inkMuted">Budget</p>
          <p className="font-mono text-xl font-semibold">${(budgetRow?.budget ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-panel-line bg-panel-surface p-4">
          <p className="text-xs uppercase text-panel-inkMuted">Remaining</p>
          <p className="font-mono text-xl font-semibold">${(budgetRow?.remaining ?? 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="rounded-lg border border-panel-line bg-panel-surface p-4">
        <h2 className="mb-2 text-sm uppercase text-panel-inkMuted">Last 6 Months</h2>
        <CategoryTrendChart data={trend} />
      </div>
      <div className="rounded-lg border border-panel-line bg-panel-surface p-4">
        <TransactionSearch transactions={categoryTransactions} />
      </div>
    </main>
  );
}
