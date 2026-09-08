import { getDebts, matchPayments, estimatePayoffDate } from '@/lib/sheets/debts';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { DebtCard } from '../components/DebtCard';
import { AddDebtForm } from '../components/AddDebtForm';

export const revalidate = 60;

export default async function DebtTrackerPage() {
  const [debts, transactions] = await Promise.all([getDebts(), getTransactions()]);

  return (
    <main className="min-h-screen space-y-4 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Debt Tracker</h1>
      <AddDebtForm />
      {debts.length === 0 ? (
        <p className="text-slate-400">No loans configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {debts.map((debt) => (
            <DebtCard
              key={debt.name}
              debt={debt}
              payments={matchPayments(debt, transactions)}
              payoffDate={estimatePayoffDate(debt)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
