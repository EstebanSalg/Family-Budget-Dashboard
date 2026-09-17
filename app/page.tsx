import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { OverviewTiles } from './components/OverviewTiles';
import { CategoryDonut } from './components/CategoryDonut';
import { BudgetVsSpentChart } from './components/BudgetVsSpentChart';
import { MonthSelector } from './components/MonthSelector';
import { IncomeVsExpensesBar } from './components/IncomeVsExpensesBar';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const [budgets, selectedMonth] = await Promise.all([getCategoryBudgets(), getSelectedMonth()]);

  const expenseRows = budgets.filter((b) => b.category !== '💰 Income');
  const incomeRow = budgets.find((b) => b.category === '💰 Income');

  const totalSpent = expenseRows.reduce((sum, b) => sum + b.spent, 0);
  const totalBudget = expenseRows.reduce((sum, b) => sum + b.budget, 0);
  const income = incomeRow?.spent ?? 0;
  const netSavings = income - totalSpent;
  const overBudgetRows = expenseRows.filter((b) => b.spent > b.budget);

  return (
    <main className="min-h-screen space-y-5 bg-panel-bg p-6 text-panel-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Household Dashboard</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-panel-inkMuted">
            Auto-logged from WhatsApp + bank alerts
          </p>
        </div>
        <MonthSelector currentMonth={selectedMonth} />
      </div>

      <OverviewTiles
        totalSpent={totalSpent}
        totalBudget={totalBudget}
        income={income}
        netSavings={netSavings}
        overBudgetCount={overBudgetRows.length}
        categoryCount={expenseRows.length}
        overBudgetCategories={overBudgetRows.map((b) => b.category)}
      />

      <IncomeVsExpensesBar income={income} expenses={totalSpent} />

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_1.35fr]">
        <div className="rounded-lg border border-panel-line bg-panel-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.4),0_14px_30px_-16px_rgba(0,0,0,.65)]">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-mono text-[12.5px] uppercase tracking-[0.08em] text-panel-inkMuted">Where It Went</h2>
            <span className="font-mono text-xs text-panel-inkMuted">${totalSpent.toFixed(2)}</span>
          </div>
          <CategoryDonut data={expenseRows.map((b) => ({ category: b.category, spent: b.spent }))} />
        </div>
        <div className="rounded-lg border border-panel-line bg-panel-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.4),0_14px_30px_-16px_rgba(0,0,0,.65)]">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-mono text-[12.5px] uppercase tracking-[0.08em] text-panel-inkMuted">Budget vs. Spent</h2>
            <span className="font-mono text-xs text-panel-inkMuted">brass tick = budget line</span>
          </div>
          <BudgetVsSpentChart
            data={expenseRows.map((b) => ({ category: b.category, budget: b.budget, spent: b.spent, status: b.status }))}
          />
        </div>
      </div>
    </main>
  );
}
