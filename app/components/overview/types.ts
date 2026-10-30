// Plain, serializable shapes the Overview server page hands to its client
// components (no Date objects, so they cross the server/client boundary safely).

export type EntryView = { day: number; description: string; amount: number };

export type CategoryView = {
  category: string; // "<emoji> <name>", the sheet's own key
  budget: number;
  spent: number;
  entries: EntryView[];
};

export type TrendPoint = { label: string; total: number; selected: boolean };

export type UpcomingBill = { name: string; amount: number; dayLabel: string };

export type LoanView = {
  name: string;
  principal: number;
  balance: number;
  payment: number;
  frequency: string;
  payoffLabel: string | null;
};

export type OverviewData = {
  monthName: string; // short sheet month, e.g. "Oct"
  monthLabel: string; // "October 2026"
  monthLong: string; // "October"
  entryMonthShort: string;
  daysInMonth: number;
  dayOfMonth: number;
  closed: boolean; // true when the selected month is not the current one
  income: number;
  categories: CategoryView[]; // tracked spending categories (no Income, no Credit Cards)
  cards: CategoryView | null; // Credit Cards: own row, excluded from totals
  trend: TrendPoint[];
  upcoming: UpcomingBill[];
  upcomingWindowDays: number;
  loans: LoanView[];
};
