import { getCategoryBudgets, getSelectedMonth } from '@/lib/sheets/budgets';
import { CategoryRow } from '../components/CategoryRow';
import { AddCategoryForm } from '../components/AddCategoryForm';
import { MonthSelector } from '../components/MonthSelector';

export const revalidate = 60;

export default async function CategoriesPage() {
  const [rows, selectedMonth] = await Promise.all([getCategoryBudgets(), getSelectedMonth()]);

  return (
    <main className="min-h-screen space-y-4 bg-slate-950 p-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <MonthSelector currentMonth={selectedMonth} />
      </div>
      <AddCategoryForm />
      <div className="rounded-lg bg-slate-900 p-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 text-xs uppercase tracking-wide text-slate-500">
          <span>Category</span>
          <div className="flex items-center gap-6">
            <span className="w-20 text-right">Spent</span>
            <span className="w-24 text-right">Budget</span>
            <span className="w-16 whitespace-nowrap text-right">% Spent</span>
          </div>
        </div>
        {rows.map((row) => (
          <CategoryRow key={row.category} row={row} />
        ))}
      </div>
    </main>
  );
}
