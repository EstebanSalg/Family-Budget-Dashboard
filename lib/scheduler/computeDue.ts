// lib/scheduler/computeDue.ts
import { advanceNextDueDate } from '@/lib/sheets/recurring';
import type { RecurringItem } from '@/lib/sheets/recurring';

function isSameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function computeDueRecurringLogs(
  items: RecurringItem[],
  today: Date
): { item: RecurringItem; newNextDueDate: Date }[] {
  return items
    .filter((item) => item.autoLogEnabled)
    .filter((item) => item.nextDueDate.getTime() <= today.getTime())
    .filter((item) => !(item.lastLoggedDate && isSameDay(item.lastLoggedDate, today)))
    .map((item) => ({ item, newNextDueDate: advanceNextDueDate(item.nextDueDate, item.frequency) }));
}
