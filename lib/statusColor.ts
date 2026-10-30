// Pure helpers only -- no Sheets API imports, safe for client components
// (see lib/sheets/months.ts for why that separation matters here).
//
// Mirrors the Monthly Budget tab's own Status formula thresholds exactly:
// `=IF(E{R}>1,"🔴 Over",IF(E{R}>0.85,"🟡 Near",IF(E{R}>0,"🟢 OK","⬜ N/A")))`
// so a ratio-based color (getRatioColor, for values with no sheet Status
// cell of their own -- overview tiles, the income-vs-expenses bar) always
// agrees with a sheet-status-based color (getStatusColor) for the same
// underlying ratio.

// Bright "glow" values for the navy theme (see the --* tokens in
// app/globals.css). The Overview page's own chips and bars use the matching CSS
// variables instead of these hexes.
export const STATUS_COLORS = {
  red: '#F43F5E',
  amber: '#F59E0B',
  green: '#10B981',
  neutral: '#94A3B8',
} as const;

export type BudgetStatus = 'over' | 'warn' | 'ok' | 'none';

// Same thresholds as the sheet's Status formula, as a discriminator for UI that
// needs to recompute status after a budget is edited (the sheet's Status cell
// would be stale until the next reload).
export function getRatioStatus(ratio: number): BudgetStatus {
  if (ratio > 1) return 'over';
  if (ratio > 0.85) return 'warn';
  if (ratio > 0) return 'ok';
  return 'none';
}

export function getStatusColor(status: string): string {
  if (status.includes('🔴')) return STATUS_COLORS.red;
  if (status.includes('🟡')) return STATUS_COLORS.amber;
  if (status.includes('🟢')) return STATUS_COLORS.green;
  return STATUS_COLORS.neutral;
}

export function getRatioColor(ratio: number): string {
  if (ratio > 1) return STATUS_COLORS.red;
  if (ratio > 0.85) return STATUS_COLORS.amber;
  if (ratio > 0) return STATUS_COLORS.green;
  return STATUS_COLORS.neutral;
}

// Short instrument-panel-style label for a sheet Status cell, e.g. for a
// pill badge next to a progress bar. Mirrors getStatusColor's same thresholds.
export function getStatusLabel(status: string): string {
  if (status.includes('🔴')) return 'Over';
  if (status.includes('🟡')) return 'Watch';
  if (status.includes('🟢')) return 'Pass';
  return 'Unused';
}
