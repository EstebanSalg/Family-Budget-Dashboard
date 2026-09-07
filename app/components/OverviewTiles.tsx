type Props = {
  totalSpent: number;
  totalBudget: number;
  income: number;
  netSavings: number;
  overBudgetCount: number;
};

export function OverviewTiles({ totalSpent, totalBudget, income, netSavings, overBudgetCount }: Props) {
  const tiles = [
    { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, sub: `of $${totalBudget.toFixed(2)} budget` },
    { label: 'Income', value: `$${income.toFixed(2)}`, sub: 'logged this month' },
    { label: 'Net Savings', value: `$${netSavings.toFixed(2)}`, sub: netSavings >= 0 ? 'saved this month' : 'deficit this month' },
    { label: 'Over Budget', value: String(overBudgetCount), sub: 'categories' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">{tile.label}</p>
          <p className="text-2xl font-semibold">{tile.value}</p>
          <p className="text-xs text-slate-500">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
