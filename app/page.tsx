import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { OverviewTiles } from './components/OverviewTiles';
import { CategoryDonut } from './components/CategoryDonut';
import { BudgetVsSpentChart } from './components/BudgetVsSpentChart';
import { MonthSelector } from './components/MonthSelector';

export const revalidate = 60;

export default async function OverviewPage() {
  const [budgets, selectedMonth] = await Promise.all([getCategoryBudgets(), getSelectedMonth()]);

  const expenseRows = budgets.filter((b) => b.category !== '💰 Income');
  const incomeRow = budgets.find((b) => b.category === '💰 Income');

  const totalSpent = expenseRows.reduce((sum, b) => sum + b.spent, 0);
  const totalBudget = expenseRows.reduce((sum, b) => sum + b.budget, 0);
  const income = incomeRow?.spent ?? 0;
  const netSavings = income - totalSpent;
  const overBudgetCount = expenseRows.filter((b) => b.spent > b.budget).length;

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <MonthSelector currentMonth={selectedMonth} />
      </div>
      <OverviewTiles
        totalSpent={totalSpent}
        totalBudget={totalBudget}
        income={income}
        netSavings={netSavings}
        overBudgetCount={overBudgetCount}
      />
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-slate-900 p-4">
          <h2 className="mb-2 text-sm uppercase text-slate-400">Where Money Is Going</h2>
          <CategoryDonut data={expenseRows.map((b) => ({ category: b.category, spent: b.spent }))} />
        </div>
        <div className="rounded-lg bg-slate-900 p-4">
          <h2 className="mb-2 text-sm uppercase text-slate-400">Budget vs Spent</h2>
          <BudgetVsSpentChart data={expenseRows.map((b) => ({ category: b.category, budget: b.budget, spent: b.spent }))} />
        </div>
      </div>
    </main>
  );
}
