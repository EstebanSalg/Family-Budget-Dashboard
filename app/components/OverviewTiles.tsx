import { getRatioColor, STATUS_COLORS } from '@/lib/statusColor';

type Props = {
  totalSpent: number;
  totalBudget: number;
  income: number;
  netSavings: number;
  overBudgetCount: number;
  categoryCount: number;
  overBudgetCategories: string[];
};

function Gauge({ ratio, color }: { ratio: number; color: string }) {
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const offset = circumference * (1 - clamped);

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={radius} fill="none" stroke="#1C1F29" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
      />
      <text
        x="26"
        y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight={700}
        fill="#DFE2EF"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        {Math.round(clamped * 100)}%
      </text>
    </svg>
  );
}

export function OverviewTiles({
  totalSpent,
  totalBudget,
  income,
  netSavings,
  overBudgetCount,
  categoryCount,
  overBudgetCategories,
}: Props) {
  // Income has no budget/target to measure against, so it stays neutral --
  // the other three each have a natural good/bad reading using the same
  // thresholds the sheet's own per-category Status column uses.
  const spentRatio = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const spentColor = totalBudget > 0 ? getRatioColor(spentRatio) : STATUS_COLORS.neutral;

  const tiles = [
    {
      label: 'Spent of Budget',
      value: `$${totalSpent.toFixed(2)}`,
      sub: `of $${totalBudget.toFixed(2)} budget`,
      color: spentColor,
      gauge: spentRatio,
    },
    { label: 'Income', value: `$${income.toFixed(2)}`, sub: 'logged this month' },
    {
      label: 'Net Savings',
      value: `$${netSavings.toFixed(2)}`,
      sub: netSavings >= 0 ? 'saved this month' : 'deficit this month',
      color: netSavings >= 0 ? STATUS_COLORS.green : STATUS_COLORS.red,
    },
    {
      label: 'Over Budget',
      value: String(overBudgetCount),
      sub:
        overBudgetCount > 0
          ? `of ${categoryCount} — ${overBudgetCategories.slice(0, 3).join(', ')}`
          : `of ${categoryCount} categories`,
      color: overBudgetCount > 0 ? STATUS_COLORS.red : STATUS_COLORS.green,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-lg border border-panel-line bg-panel-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,.4),0_14px_30px_-16px_rgba(0,0,0,.65)]"
        >
          {tile.gauge !== undefined ? (
            <div className="flex items-center gap-3.5">
              <Gauge ratio={tile.gauge} color={tile.color!} />
              <div className="min-w-0">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-panel-inkMuted">{tile.label}</p>
                <p className="mt-1 text-xl font-extrabold text-panel-ink">{tile.value}</p>
                <p className="mt-0.5 truncate text-[11px] text-panel-inkMuted">{tile.sub}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-panel-inkMuted">{tile.label}</p>
              <p className="mt-1.5 text-2xl font-extrabold" style={tile.color ? { color: tile.color } : { color: '#DFE2EF' }}>
                {tile.value}
              </p>
              <p className="mt-1 truncate text-[11px] text-panel-inkMuted">{tile.sub}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
