// Pure helpers only -- no Sheets API imports, safe for client components
// (see lib/sheets/months.ts for why that separation matters here).
//
// Mirrors the Monthly Budget tab's own Status formula thresholds exactly:
// `=IF(E{R}>1,"🔴 Over",IF(E{R}>0.85,"🟡 Near",IF(E{R}>0,"🟢 OK","⬜ N/A")))`
// so a ratio-based color (getRatioColor, for values with no sheet Status
// cell of their own -- overview tiles, the income-vs-expenses bar) always
// agrees with a sheet-status-based color (getStatusColor) for the same
// underlying ratio.

export const STATUS_COLORS = {
  red: '#f87171',
  amber: '#fbbf24',
  green: '#4ade80',
  neutral: '#64748b',
} as const;

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
