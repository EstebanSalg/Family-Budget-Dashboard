// Pure formatting helpers shared by the Overview components.
import type { BudgetStatus } from '@/lib/statusColor';

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export const money0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const moneyK = (n: number) => '$' + (n / 1000).toFixed(1) + 'k';

export function list(items: string[]): string {
  if (items.length < 2) return items[0] ?? '';
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

// Category keys in the sheet are "<emoji> <name>" (e.g. "🛒 Groceries"). The
// emoji is part of the category's identity, so keep it, but let the UI place
// it separately from the name.
export function splitCategory(category: string): { emoji: string; name: string } {
  const i = category.indexOf(' ');
  if (i > 0 && /[^\u0000-\u007F]/.test(category.slice(0, i))) {
    return { emoji: category.slice(0, i), name: category.slice(i + 1) };
  }
  return { emoji: '', name: category };
}

export function ratioOf(spent: number, budget: number): number {
  if (budget > 0) return spent / budget;
  return spent > 0 ? Infinity : 0;
}

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  over: 'Over',
  warn: 'Close',
  ok: 'On track',
  none: 'No spend',
};

// Tinted pill with a matching hairline, like the Family Hub's chips.
export const CHIP_CLASS: Record<BudgetStatus, string> = {
  over: 'bg-status-over-soft text-status-over-ink ring-1 ring-inset ring-status-over-line',
  warn: 'bg-status-warn-soft text-status-warn-ink ring-1 ring-inset ring-status-warn-line',
  ok: 'bg-status-ok-soft text-status-ok-ink ring-1 ring-inset ring-status-ok-line',
  none: 'bg-panel-tint text-panel-inkMuted ring-1 ring-inset ring-panel-line',
};

// Filled bars carry a soft glow in their own color.
export const FILL_CLASS: Record<BudgetStatus, string> = {
  over: 'bg-status-over-bar shadow-glow-over',
  warn: 'bg-status-warn-bar shadow-glow-warn',
  ok: 'bg-status-ok-bar shadow-glow-ok',
  none: 'bg-transparent',
};

export const DOT_CLASS: Record<'ok' | 'warn' | 'over', string> = {
  ok: 'bg-status-ok-bar shadow-[0_0_10px_var(--ok-glow)]',
  warn: 'bg-status-warn-bar shadow-[0_0_10px_var(--warn-glow)]',
  over: 'bg-status-over-bar shadow-[0_0_10px_var(--over-glow)]',
};
