import { getAnnualSummary } from '@/lib/sheets/annualSummary';
import { PAGE, PageHeader } from '../components/ui';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const money = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

export default async function AnnualSummaryPage() {
  const rows = await getAnnualSummary();

  return (
    <main className={`${PAGE} space-y-5`}>
      <PageHeader title="Annual summary" subtitle="Spending by category for each month of the year." />
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-panel-line text-[12.5px] font-medium text-panel-faint">
              <th className="sticky left-0 bg-panel-surface px-4 py-3 text-left">Category</th>
              {MONTHS.map((m) => (
                <th key={m} className="px-3 py-3 text-right">{m}</th>
              ))}
              <th className="px-4 py-3 text-right text-panel-inkMuted">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-t border-panel-lineSoft transition-colors first:border-t-0 hover:bg-panel-tint">
                <td className="sticky left-0 bg-panel-surface px-4 py-2.5 font-medium">{row.category}</td>
                {row.months.map((v, i) => (
                  <td key={i} className={`px-3 py-2.5 text-right ${v ? '' : 'text-panel-faint'}`}>{v ? money(v) : '–'}</td>
                ))}
                <td className="px-4 py-2.5 text-right font-bold">{money(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
