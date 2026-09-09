import { getRatioColor, STATUS_COLORS } from '@/lib/statusColor';

type Props = {
  income: number;
  expenses: number;
};

export function IncomeVsExpensesBar({ income, expenses }: Props) {
  const saved = income - expenses;
  // No income logged yet this month is the worst case, not a neutral one --
  // any spending against $0 income reads as fully over, not "no data".
  const hasIncome = income > 0;
  const ratio = hasIncome ? expenses / income : expenses > 0 ? Infinity : 0;
  const widthPercent = hasIncome ? Math.min(ratio, 1) * 100 : expenses > 0 ? 100 : 0;
  const color = hasIncome ? getRatioColor(ratio) : expenses > 0 ? STATUS_COLORS.red : STATUS_COLORS.neutral;
  const savingsRate = hasIncome ? (saved / income) * 100 : expenses > 0 ? -100 : 0;

  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm uppercase text-slate-400">Income vs Expenses</h2>
        <div className="flex gap-4 text-right text-sm">
          <div>
            <p className="text-xs uppercase text-slate-500">Income</p>
            <p className="font-semibold" style={{ color: '#4ade80' }}>${income.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Expenses</p>
            <p className="font-semibold" style={{ color: '#fbbf24' }}>${expenses.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Saved</p>
            <p className="font-semibold" style={{ color: saved >= 0 ? '#4ade80' : '#f87171' }}>${saved.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div className="h-8 w-full overflow-hidden rounded bg-slate-800">
        <div
          className="flex h-full items-center px-3 text-sm font-medium text-slate-950 transition-[width]"
          style={{ width: `${Math.max(widthPercent, expenses > 0 ? 8 : 0)}%`, backgroundColor: color }}
        >
          {expenses > 0 && `$${expenses.toFixed(0)}`}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Savings rate <span className={savingsRate >= 0 ? 'text-green-400' : 'text-red-400'}>{savingsRate.toFixed(0)}%</span>
      </p>
    </div>
  );
}
