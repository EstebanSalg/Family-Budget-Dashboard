import type { Debt } from '@/lib/sheets/debts';
import type { Transaction } from '@/lib/sheets/expenseLog';
import { ProgressBar } from './overview/ProgressBar';
import { PANEL } from './ui';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function DebtCard({ debt, payments, payoffDate }: { debt: Debt; payments: Transaction[]; payoffDate: Date | null }) {
  const paidSoFar = debt.principal - debt.currentBalance;
  const ratio = debt.principal > 0 ? Math.max(paidSoFar, 0) / debt.principal : 0;

  return (
    <section className={PANEL}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold">{debt.name}</h2>
        <span className="text-sm text-panel-inkMuted">
          <b className="text-lg font-bold text-panel-ink">{money(debt.currentBalance)}</b> remaining
        </span>
      </div>
      <ProgressBar ratio={ratio} status="debt" className="mt-3.5" />
      <p className="mt-2.5 text-[13.5px] text-panel-inkMuted">
        {Math.round(ratio * 100)}% paid {'·'} {money(debt.payment)} {debt.frequency.toLowerCase()}
        {payoffDate && ` · est. payoff ${payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
      </p>
      {payments.length > 0 && (
        <ul className="mt-4 border-t border-panel-line pt-1">
          {payments.slice(0, 5).map((p, i) => (
            <li key={i} className="flex justify-between border-t border-panel-lineSoft py-2 text-sm first:border-t-0">
              <span className="text-panel-inkMuted">{p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
              <span className="font-semibold">{money(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
