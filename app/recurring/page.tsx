import { getRecurringItems, type RecurringItem } from '@/lib/sheets/recurring';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { RecurringForm } from '../components/RecurringForm';
import { ConfirmationQueue } from '../components/ConfirmationQueue';
import { PAGE, PANEL, PageHeader } from '../components/ui';

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

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
    <main className={`${PAGE} space-y-6`}>
      <PageHeader title="Recurring and automation" subtitle="Bills that repeat, and automatic entries waiting for your OK." />

      <section aria-labelledby="confirm-h" className="space-y-3">
        <h2 id="confirm-h" className="text-base font-semibold">Needs confirmation</h2>
        <ConfirmationQueue pending={pending} />
      </section>

      <section aria-labelledby="items-h" className="space-y-3">
        <h2 id="items-h" className="text-base font-semibold">Recurring items</h2>
        <RecurringForm categories={categories} />
        <div className="space-y-2.5">
          {groups.map(([category, categoryItems]) => (
            <details key={category} className={`${PANEL} group !p-0`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span>
                  {category} <span className="ml-1 font-normal text-panel-inkMuted">({categoryItems.length})</span>
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px] text-panel-inkMuted transition-transform group-open:rotate-180">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <ul className="border-t border-panel-line px-5 py-1">
                {categoryItems.map((item) => (
                  <li key={item.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-panel-lineSoft py-3 text-sm first:border-t-0">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-panel-inkMuted">
                      <b className="font-semibold text-panel-ink">{money(item.expectedAmount)}</b> {item.frequency.toLowerCase()} {'·'} next{' '}
                      {item.nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                    </span>
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
