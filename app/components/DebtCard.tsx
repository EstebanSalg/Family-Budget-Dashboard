import type { Debt } from '@/lib/sheets/debts';
import type { Transaction } from '@/lib/sheets/expenseLog';

export function DebtCard({ debt, payments, payoffDate }: { debt: Debt; payments: Transaction[]; payoffDate: Date | null }) {
  const paidSoFar = debt.principal - debt.currentBalance;
  const percentPaid = debt.principal > 0 ? (paidSoFar / debt.principal) * 100 : 0;

  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{debt.name}</h3>
        <span className="text-sm text-slate-400">${debt.currentBalance.toFixed(2)} remaining</span>
      </div>
      <div className="mt-2 h-2 rounded bg-slate-800">
        <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.min(100, percentPaid).toFixed(0)}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        ${debt.payment.toFixed(2)} / {debt.frequency}
        {payoffDate && ` · est. payoff ${payoffDate.toLocaleDateString()}`}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        {payments.slice(0, 5).map((p, i) => (
          <li key={i}>{p.date.toLocaleDateString()} — ${p.amount.toFixed(2)}</li>
        ))}
      </ul>
    </div>
  );
}
