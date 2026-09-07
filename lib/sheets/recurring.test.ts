import { describe, it, expect, vi } from 'vitest';
import { advanceNextDueDate } from './recurring';

describe('advanceNextDueDate', () => {
  it('advances weekly by 7 days', () => {
    const result = advanceNextDueDate(new Date('2026-09-01'), 'Weekly');
    expect(result.toISOString().slice(0, 10)).toBe('2026-09-08');
  });
  it('advances monthly by calendar month, not 30 days', () => {
    const result = advanceNextDueDate(new Date('2026-01-31'), 'Monthly');
    // Jan 31 + 1 month should land in Feb, not overflow into March
    expect(result.getUTCMonth()).toBe(1);
  });
  it('advances annually by one year', () => {
    const result = advanceNextDueDate(new Date('2026-06-01'), 'Annually');
    expect(result.getUTCFullYear()).toBe(2027);
  });
});

describe('ensureRecurringColumns', () => {
  it('adds missing headers without touching existing ones', async () => {
    const updateSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({ data: { values: [['Name', 'Amount', 'Category']] } })),
            update: updateSpy,
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { ensureRecurringColumns } = await import('./recurring');

    await ensureRecurringColumns();

    const writtenHeaders = updateSpy.mock.calls[0][0].requestBody.values[0];
    expect(writtenHeaders).toEqual([
      'Name', 'Amount', 'Category', 'NextDueDate', 'ExpectedAmount', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate',
    ]);
  });
});

describe('getRecurringItems', () => {
  it('reads name from the Item column, not column A (which is Category)', async () => {
    // Real schema discovered in Task 3: column A is "Category" (e.g. an emoji
    // label), and the item's actual name lives in "Item" (e.g. "Netflix") —
    // NOT column A. This test guards against re-introducing a bug where
    // `name` was read from row[0] and ended up identical to `category`.
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({
              data: {
                values: [
                  ['Category', 'Item', 'ExpectedAmount', 'Keyword', 'Type', 'Notes', 'NextDueDate', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate'],
                  ['🎬 Entertainment', 'Netflix', '$15.99', 'netflix', 'fixed', '', '2026-09-15', 'Monthly', 'TRUE', ''],
                ],
              },
            })),
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { getRecurringItems } = await import('./recurring');

    const items = await getRecurringItems();

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Netflix');
    expect(items[0].category).toBe('🎬 Entertainment');
    expect(items[0].name).not.toBe(items[0].category);
  });
});
