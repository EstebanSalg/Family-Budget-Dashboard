import { getRecurringItems, type RecurringItem } from '@/lib/sheets/recurring';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { RecurringForm } from '../components/RecurringForm';
import { ConfirmationQueue } from '../components/ConfirmationQueue';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

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
    <main className="min-h-screen space-y-6 bg-panel-bg p-6 text-panel-ink">
      <h1 className="text-2xl font-semibold">Recurring & Automation</h1>
      <section>
        <h2 className="mb-2 text-sm uppercase text-panel-inkMuted">Needs Confirmation</h2>
        <ConfirmationQueue pending={pending} />
      </section>
      <section>
        <h2 className="mb-2 text-sm uppercase text-panel-inkMuted">Recurring Items</h2>
        <RecurringForm categories={categories} />
        <div className="space-y-1">
          {groups.map(([category, categoryItems]) => (
            <details key={category} className="rounded border border-panel-line bg-panel-surface p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                {category} <span className="text-panel-inkMuted">({categoryItems.length})</span>
              </summary>
              <ul className="mt-2 space-y-1 border-t border-panel-line pt-2">
                {categoryItems.map((item) => (
                  <li key={item.name} className="flex justify-between py-1">
                    <span>{item.name}</span>
                    <span className="font-mono">${item.expectedAmount.toFixed(2)} / {item.frequency} — next {item.nextDueDate.toLocaleDateString()}</span>
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
