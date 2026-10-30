import Link from 'next/link';
import { getTransactions } from '@/lib/sheets/expenseLog';
import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { getSixMonthTrend } from '@/lib/sheets/monthlyTrend';
import { CategoryTrendChart } from '../../components/CategoryTrendChart';
import { TransactionSearch } from '../../components/TransactionSearch';
import { PAGE, PANEL, PageHeader } from '../../components/ui';

export default async function CategoryDetailPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const [transactions, budgets, selectedMonth] = await Promise.all([
    getTransactions(),
    getCategoryBudgets(),
    getSelectedMonth(),
  ]);

  const budgetRow = budgets.find((b) => b.category === category);
  // Scoped to the same month selected on Overview/Categories -- matches the
  // "Spent" figure above it (also month-scoped, not year, per the sheet's
  // own SUMPRODUCT convention). The 6-month trend chart below intentionally
  // stays a trailing 6-month view regardless of the selected month.
  const categoryTransactions = transactions
    .filter((t) => t.category === category && t.month === selectedMonth)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const trend = getSixMonthTrend(transactions, category, new Date());
  const remaining = budgetRow?.remaining ?? 0;

  return (
    <main className={`${PAGE} space-y-5`}>
      <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-medium text-panel-inkMuted transition-colors hover:text-accent">
        <span aria-hidden="true">{'←'}</span> Categories
      </Link>
      <PageHeader title={category} />

      <div className={`${PANEL} grid grid-cols-3`}>
        <Figure label="Spent" value={`$${(budgetRow?.spent ?? 0).toFixed(2)}`} first />
        <Figure label="Budget" value={`$${(budgetRow?.budget ?? 0).toFixed(2)}`} />
        <Figure label="Remaining" value={`${remaining < 0 ? '−' : ''}$${Math.abs(remaining).toFixed(2)}`} tone={remaining < 0 ? 'text-status-over-ink' : ''} />
      </div>

      <section className={PANEL} aria-labelledby="trend-h">
        <h2 id="trend-h" className="mb-3 text-base font-semibold">Last six months</h2>
        <CategoryTrendChart data={trend} />
      </section>

      <section className={PANEL} aria-labelledby="entries-h">
        <h2 id="entries-h" className="mb-3 text-base font-semibold">Entries this month</h2>
        <TransactionSearch transactions={categoryTransactions} />
      </section>
    </main>
  );
}

function Figure({ label, value, first = false, tone = '' }: { label: string; value: string; first?: boolean; tone?: string }) {
  return (
    <div className={`min-w-0 ${first ? 'pr-3' : 'border-l border-panel-line px-3 sm:px-6'}`}>
      <span className="block text-[13px] text-panel-inkMuted">{label}</span>
      <b className={`mt-0.5 block text-[clamp(1.1rem,3.4vw,1.85rem)] font-bold leading-[1.15] tracking-tight ${tone}`}>{value}</b>
    </div>
  );
}
