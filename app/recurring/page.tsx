import { getRecurringItems } from '@/lib/sheets/recurring';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { RecurringForm } from '../components/RecurringForm';
import { ConfirmationQueue } from '../components/ConfirmationQueue';

export const revalidate = 60;

export default async function RecurringPage() {
  const [items, transactions] = await Promise.all([getRecurringItems(), getTransactions()]);
  const pending = transactions.filter((t) => t.source === 'Auto-Pending');

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Recurring & Automation</h1>
      <section>
        <h2 className="mb-2 text-sm uppercase text-slate-400">Needs Confirmation</h2>
        <ConfirmationQueue pending={pending} />
      </section>
      <section>
        <h2 className="mb-2 text-sm uppercase text-slate-400">Recurring Items</h2>
        <RecurringForm />
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.name} className="flex justify-between rounded bg-slate-900 p-3 text-sm">
              <span>{item.name} ({item.category})</span>
              <span>${item.expectedAmount.toFixed(2)} / {item.frequency} — next {item.nextDueDate.toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
