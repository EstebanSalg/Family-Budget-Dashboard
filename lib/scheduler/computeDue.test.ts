// lib/scheduler/computeDue.test.ts
import { describe, it, expect } from 'vitest';
import { computeDueRecurringLogs } from './computeDue';
import type { RecurringItem } from '@/lib/sheets/recurring';

function item(overrides: Partial<RecurringItem>): RecurringItem {
  return {
    name: 'Rent', category: '🏠 Housing', expectedAmount: 2650, frequency: 'Monthly',
    nextDueDate: new Date('2026-09-01'), autoLogEnabled: true, lastLoggedDate: null,
    ...overrides,
  };
}

describe('computeDueRecurringLogs', () => {
  it('includes items whose next due date has arrived', () => {
    const due = computeDueRecurringLogs([item({ nextDueDate: new Date('2026-09-01') })], new Date('2026-09-05'));
    expect(due).toHaveLength(1);
    expect(due[0].newNextDueDate.toISOString().slice(0, 10)).toBe('2026-10-01');
  });

  it('excludes items not yet due', () => {
    const due = computeDueRecurringLogs([item({ nextDueDate: new Date('2026-09-10') })], new Date('2026-09-05'));
    expect(due).toHaveLength(0);
  });

  it('excludes items with auto-logging disabled', () => {
    const due = computeDueRecurringLogs([item({ nextDueDate: new Date('2026-09-01'), autoLogEnabled: false })], new Date('2026-09-05'));
    expect(due).toHaveLength(0);
  });

  it('does not log the same item twice in one day', () => {
    const due = computeDueRecurringLogs(
      [item({ nextDueDate: new Date('2026-09-01'), lastLoggedDate: new Date('2026-09-05') })],
      new Date('2026-09-05')
    );
    expect(due).toHaveLength(0);
  });
});
