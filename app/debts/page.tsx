import { getDebts, matchPayments, estimatePayoffDate } from '@/lib/sheets/debts';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { DebtCard } from '../components/DebtCard';
import { AddDebtForm } from '../components/AddDebtForm';
import { PAGE, PageHeader } from '../components/ui';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

export default async function DebtTrackerPage() {
  const [debts, transactions] = await Promise.all([getDebts(), getTransactions()]);

  return (
    <main className={`${PAGE} space-y-5`}>
      <PageHeader title="Debts" subtitle="Loans and their payoff progress, kept apart from the monthly budget." />
      <AddDebtForm />
      {debts.length === 0 ? (
        <p className="text-panel-inkMuted">No loans configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
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
