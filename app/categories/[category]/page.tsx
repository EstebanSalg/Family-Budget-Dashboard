import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { getSixMonthTrend } from '@/lib/sheets/monthlyTrend';
import { CategoryTrendChart } from '../../components/CategoryTrendChart';
import { TransactionSearch } from '../../components/TransactionSearch';

export default async function CategoryDetailPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const [transactions, budgets] = await Promise.all([getTransactions(), getCategoryBudgets()]);

  const budgetRow = budgets.find((b) => b.category === category);
  const categoryTransactions = transactions
    .filter((t) => t.category === category)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const trend = getSixMonthTrend(transactions, category, new Date());

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">{category}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Spent</p>
          <p className="text-xl font-semibold">${(budgetRow?.spent ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Budget</p>
          <p className="text-xl font-semibold">${(budgetRow?.budget ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Remaining</p>
          <p className="text-xl font-semibold">${(budgetRow?.remaining ?? 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="rounded-lg bg-slate-900 p-4">
        <h2 className="mb-2 text-sm uppercase text-slate-400">Last 6 Months</h2>
        <CategoryTrendChart data={trend} />
      </div>
      <div className="rounded-lg bg-slate-900 p-4">
        <TransactionSearch transactions={categoryTransactions} />
      </div>
    </main>
  );
}
