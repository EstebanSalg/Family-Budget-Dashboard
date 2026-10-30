import { getAnnualSummary } from '@/lib/sheets/annualSummary';

// force-dynamic (not ISR): this page reads live Google Sheets data, which
// isn't reachable during `next build` inside the Docker image (Fly secrets
// are runtime-only, not build-time) -- always render per-request instead.
export const dynamic = 'force-dynamic';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function AnnualSummaryPage() {
  const rows = await getAnnualSummary();

  return (
    <main className="min-h-screen space-y-4 overflow-x-auto bg-panel-bg p-6 text-panel-ink">
      <h1 className="text-2xl font-semibold">Annual Summary</h1>
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="text-left text-panel-inkMuted">
            <th className="p-2">Category</th>
            {MONTHS.map((m) => <th key={m} className="p-2 text-right">{m}</th>)}
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row.category} className="border-t border-panel-line">
              <td className="p-2 font-sans">{row.category}</td>
              {row.months.map((v, i) => <td key={i} className="p-2 text-right">{v ? `$${v.toFixed(2)}` : '-'}</td>)}
              <td className="p-2 text-right font-medium">${row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
