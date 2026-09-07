// lib/sheets/budgets.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('./client', () => ({
  getSheetsClient: vi.fn(async () => ({
    spreadsheets: {
      values: {
        get: vi.fn(async () => ({
          data: {
            values: [
              ['Category', 'Budget ($)', 'Spent ($)', 'Remaining ($)', '% Used', 'Status'],
              ['🛒 Groceries', '1,100.00', '1,659.71', '-559.71', '150.88%', '🔴 Over'],
              ['🍽️ Dining Out', '400.00', '287.97', '112.03', '71.99%', '🟢 OK'],
            ],
          },
        })),
      },
    },
  })),
  getSpreadsheetId: vi.fn(() => 'test-id'),
}));

describe('getCategoryBudgets', () => {
  it('parses category rows, skipping the header', async () => {
    const { getCategoryBudgets } = await import('./budgets');
    const rows = await getCategoryBudgets();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      category: '🛒 Groceries',
      budget: 1100,
      spent: 1659.71,
      remaining: -559.71,
    });
  });
});

describe('updateCategoryBudget', () => {
  it('writes the new budget to the row matching the category', async () => {
    const updateSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({
              data: {
                values: [
                  ['Category', 'Budget ($)', 'Spent ($)', 'Remaining ($)', '% Used', 'Status'],
                  ['🛒 Groceries', '1,100.00', '1,659.71', '-559.71', '150.88%', '🔴 Over'],
                ],
              },
            })),
            update: updateSpy,
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { updateCategoryBudget } = await import('./budgets');

    await updateCategoryBudget('🛒 Groceries', 1200);

    // NOTE: BUDGET_RANGE (from lib/sheets/layout.ts, Task 3's real sheet
    // discovery) is "'Monthly Budget'!A3:F1001" — its header row is sheet
    // row 3, so with the header at fetched index 0 and Groceries at fetched
    // index 1, the correct real sheet row is 3 + 1 = 4 (matches layout.ts's
    // own comment: "Category rows run 4-19"). Asserting B4 here reflects
    // the actual, already-committed BUDGET_RANGE rather than a stale
    // assumption that it starts at row 1.
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        range: expect.stringContaining('B4'),
        requestBody: { values: [[1200]] },
      })
    );
  });
});

describe('addCategory', () => {
  it('appends a row to the budget tab and the annual summary tab', async () => {
    const appendSpy = vi.fn(async (_params: any) => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: { values: { append: appendSpy } },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { addCategory } = await import('./budgets');

    await addCategory({ emoji: '🎮', name: 'Gaming', startingBudget: 50 });

    expect(appendSpy).toHaveBeenCalledTimes(2);
    expect(appendSpy.mock.calls[0][0].requestBody.values).toEqual([['🎮 Gaming', 50, 0, 50, 0, '⬜ N/A']]);
    expect(appendSpy.mock.calls[1][0].requestBody.values[0][0]).toBe('🎮 Gaming');
  });
});
