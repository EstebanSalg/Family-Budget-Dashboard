import { getRecurringItems, type RecurringItem } from '@/lib/sheets/recurring';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { RecurringForm } from '../components/RecurringForm';
import { ConfirmationQueue } from '../components/ConfirmationQueue';

export const revalidate = 60;

function groupByCategory(items: RecurringItem[]): [string, RecurringItem[]][] {
  const groups = new Map<string, RecurringItem[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  return Array.from(groups.entries());
}

export default async function RecurringPage() {
  const [items, transactions, budgets] = await Promise.all([
    getRecurringItems(),
    getTransactions(),
    getCategoryBudgets(),
  ]);
  const pending = transactions.filter((t) => t.source === 'Auto-Pending');
  const categories = budgets.map((b) => b.category);
  const groups = groupByCategory(items);

  return (
    <main className="min-h-screen space-y-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Recurring & Automation</h1>
      <section>
        <h2 className="mb-2 text-sm uppercase text-slate-400">Needs Confirmation</h2>
        <ConfirmationQueue pending={pending} />
      </section>
      <section>
        <h2 className="mb-2 text-sm uppercase text-slate-400">Recurring Items</h2>
        <RecurringForm categories={categories} />
        <div className="space-y-1">
          {groups.map(([category, categoryItems]) => (
            <details key={category} className="rounded bg-slate-900 p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                {category} <span className="text-slate-500">({categoryItems.length})</span>
              </summary>
              <ul className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                {categoryItems.map((item) => (
                  <li key={item.name} className="flex justify-between py-1">
                    <span>{item.name}</span>
                    <span>${item.expectedAmount.toFixed(2)} / {item.frequency} — next {item.nextDueDate.toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
