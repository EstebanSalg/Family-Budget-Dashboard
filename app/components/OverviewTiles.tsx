import { getRatioColor, STATUS_COLORS } from '@/lib/statusColor';

type Props = {
  totalSpent: number;
  totalBudget: number;
  income: number;
  netSavings: number;
  overBudgetCount: number;
};

export function OverviewTiles({ totalSpent, totalBudget, income, netSavings, overBudgetCount }: Props) {
  // Income has no budget/target to measure against, so it stays neutral --
  // the other three each have a natural good/bad reading using the same
  // thresholds the sheet's own per-category Status column uses.
  const tiles = [
    {
      label: 'Total Spent',
      value: `$${totalSpent.toFixed(2)}`,
      sub: `of $${totalBudget.toFixed(2)} budget`,
      color: totalBudget > 0 ? getRatioColor(totalSpent / totalBudget) : undefined,
    },
    { label: 'Income', value: `$${income.toFixed(2)}`, sub: 'logged this month', color: undefined },
    {
      label: 'Net Savings',
      value: `$${netSavings.toFixed(2)}`,
      sub: netSavings >= 0 ? 'saved this month' : 'deficit this month',
      color: netSavings >= 0 ? STATUS_COLORS.green : STATUS_COLORS.red,
    },
    {
      label: 'Over Budget',
      value: String(overBudgetCount),
      sub: 'categories',
      color: overBudgetCount > 0 ? STATUS_COLORS.red : STATUS_COLORS.green,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">{tile.label}</p>
          <p className="text-2xl font-semibold" style={tile.color ? { color: tile.color } : undefined}>
            {tile.value}
          </p>
          <p className="text-xs text-slate-500">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
