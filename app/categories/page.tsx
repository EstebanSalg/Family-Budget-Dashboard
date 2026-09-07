import { getCategoryBudgets } from '@/lib/sheets/budgets';
import { CategoryRow } from '../components/CategoryRow';

export default async function CategoriesPage() {
  const rows = await getCategoryBudgets();

  return (
    <main className="min-h-screen space-y-4 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <div className="rounded-lg bg-slate-900 p-4">
        {rows.map((row) => (
          <CategoryRow key={row.category} row={row} />
        ))}
      </div>
    </main>
  );
}
