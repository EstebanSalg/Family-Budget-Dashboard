export function parseCurrency(raw: string | number | undefined | null): number {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'number') return raw;
  const cleaned = raw.replace(/[$,]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const value = Number.parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function parseSheetDate(raw: string): Date {
  // Sheet dates are stored as "YYYY-MM-DD"; parse as UTC to avoid local-timezone
  // off-by-one-day shifts.
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
