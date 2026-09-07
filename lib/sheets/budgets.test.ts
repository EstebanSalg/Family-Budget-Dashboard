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
  // Fixed sheet state mirroring the exact live-discovered formula shapes
  // (see lib/sheets/budgets.ts and the Task 10 report for the live
  // investigation these are copied from), scaled down to 2 category rows
  // instead of 16 so the test stays readable. BUDGET_RANGE starts at sheet
  // row 3 (the header), so fetched index 0 = row 3 (header), index 1 = row 4
  // (Groceries), index 2 = row 5 (Dining Out), index 3 = row 6 (TOTAL).
  const monthlyRows = [
    ['Category', 'Budget ($)', 'Spent ($)', 'Remaining ($)', '% Used', 'Status'],
    [
      '🛒 Groceries',
      1100,
      '=SUMPRODUCT((\'Expense Log\'!C2:C10029="🛒 Groceries")*(\'Expense Log\'!F2:F10029=C2)*(\'Expense Log\'!B2:B10029))',
      '=B4-C4',
      '=IF(B4=0,0,C4/B4)',
      '=IF(E4>1,"🔴 Over",IF(E4>0.85,"🟡 Near",IF(E4>0,"🟢 OK","⬜ N/A")))',
    ],
    [
      '🍽️ Dining Out',
      400,
      '=SUMPRODUCT((\'Expense Log\'!C2:C10029="🍽️ Dining Out")*(\'Expense Log\'!F2:F10029=C2)*(\'Expense Log\'!B2:B10029))',
      '=B5-C5',
      '=IF(B5=0,0,C5/B5)',
      '=IF(E5>1,"🔴 Over",IF(E5>0.85,"🟡 Near",IF(E5>0,"🟢 OK","⬜ N/A")))',
    ],
    ['TOTAL', '=SUM(B4:B5)', '=SUM(C4:C5)', '=SUM(D4:D5)', '=IF(B6=0,0,C6/B6)'],
  ];

  // ANNUAL_SUMMARY_RANGE starts at sheet row 2 (the header): fetched index 0
  // = row 2 (header), index 1 = row 3 (Groceries), index 2 = row 4 (Dining
  // Out), index 3 = row 5 (TOTAL).
  function monthFormula(category: string, month: string): string {
    return `=SUMPRODUCT(('Expense Log'!C2:C10029="${category}")*('Expense Log'!F2:F10029="${month}")*('Expense Log'!B2:B10029))`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const annualRows = [
    ['Category', ...months, 'TOTAL'],
    ['🛒 Groceries', ...months.map((m) => monthFormula('🛒 Groceries', m)), '=SUM(B3:M3)'],
    ['🍽️ Dining Out', ...months.map((m) => monthFormula('🍽️ Dining Out', m)), '=SUM(B4:M4)'],
    [
      'TOTAL',
      '=SUM(B3:B4)', '=SUM(C3:C4)', '=SUM(D3:D4)', '=SUM(E3:E4)', '=SUM(F3:F4)', '=SUM(G3:G4)',
      '=SUM(H3:H4)', '=SUM(I3:I4)', '=SUM(J3:J4)', '=SUM(K3:K4)', '=SUM(L3:L4)', '=SUM(M3:M4)', '=SUM(N3:N4)',
    ],
  ];

  it('inserts a formula-templated row above TOTAL on both tabs and rewrites TOTAL ranges', async () => {
    const batchUpdateSpy = vi.fn(async () => ({ data: {} }));
    const updateSpy = vi.fn(async () => ({ data: {} }));
    const getSpy = vi.fn(async (params: any) => {
      if (params.range === "'Monthly Budget'!A3:F1001") return { data: { values: monthlyRows } };
      if (params.range === "'Annual Summary'!A2:N1001") return { data: { values: annualRows } };
      throw new Error(`Unexpected range in test: ${params.range}`);
    });
    const metaSpy = vi.fn(async () => ({
      data: {
        sheets: [
          { properties: { title: 'Monthly Budget', sheetId: 1316592569 } },
          { properties: { title: 'Annual Summary', sheetId: 744164189 } },
        ],
      },
    }));

    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          get: metaSpy,
          values: { get: getSpy, update: updateSpy },
          batchUpdate: batchUpdateSpy,
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { addCategory } = await import('./budgets');

    await addCategory({ emoji: '🎮', name: 'Gaming', startingBudget: 50 });

    // --- Monthly Budget: TOTAL fetched at row 6 -> new category takes row 6,
    // TOTAL shifts to row 7. insertDimension targets the row immediately
    // before (old) TOTAL: 0-based startIndex 5, endIndex 6.
    expect(batchUpdateSpy).toHaveBeenCalledWith({
      spreadsheetId: 'test-id',
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: { sheetId: 1316592569, dimension: 'ROWS', startIndex: 5, endIndex: 6 },
              inheritFromBefore: true,
            },
          },
        ],
      },
    });

    expect(updateSpy).toHaveBeenCalledWith({
      spreadsheetId: 'test-id',
      range: "'Monthly Budget'!A6:F6",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          '🎮 Gaming',
          50,
          '=SUMPRODUCT((\'Expense Log\'!C2:C10029="🎮 Gaming")*(\'Expense Log\'!F2:F10029=C2)*(\'Expense Log\'!B2:B10029))',
          '=B6-C6',
          '=IF(B6=0,0,C6/B6)',
          '=IF(E6>1,"🔴 Over",IF(E6>0.85,"🟡 Near",IF(E6>0,"🟢 OK","⬜ N/A")))',
        ]],
      },
    });

    // TOTAL's existing SUM formulas are extended by appending the new row as
    // an additional term (not recomputed from scratch as "=SUM(B4:B6)") --
    // this preserves whatever the old formula already covered, so TOTAL's
    // computed value changes by exactly the new row's own value.
    expect(updateSpy).toHaveBeenCalledWith({
      spreadsheetId: 'test-id',
      range: "'Monthly Budget'!B7:E7",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['=SUM(B4:B5)+B6', '=SUM(C4:C5)+C6', '=SUM(D4:D5)+D6', '=IF(B7=0,0,C7/B7)']],
      },
    });

    // --- Annual Summary: TOTAL fetched at row 5 -> new category takes row 5,
    // TOTAL shifts to row 6. insertDimension targets 0-based startIndex 4,
    // endIndex 5.
    expect(batchUpdateSpy).toHaveBeenCalledWith({
      spreadsheetId: 'test-id',
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: { sheetId: 744164189, dimension: 'ROWS', startIndex: 4, endIndex: 5 },
              inheritFromBefore: true,
            },
          },
        ],
      },
    });

    expect(updateSpy).toHaveBeenCalledWith({
      spreadsheetId: 'test-id',
      range: "'Annual Summary'!A5:N5",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          '🎮 Gaming',
          ...months.map((m) => monthFormula('🎮 Gaming', m)),
          '=SUM(B5:M5)',
        ]],
      },
    });

    expect(updateSpy).toHaveBeenCalledWith({
      spreadsheetId: 'test-id',
      range: "'Annual Summary'!B6:N6",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          '=SUM(B3:B4)+B5', '=SUM(C3:C4)+C5', '=SUM(D3:D4)+D5', '=SUM(E3:E4)+E5', '=SUM(F3:F4)+F5', '=SUM(G3:G4)+G5',
          '=SUM(H3:H4)+H5', '=SUM(I3:I4)+I5', '=SUM(J3:J4)+J5', '=SUM(K3:K4)+K5', '=SUM(L3:L4)+L5', '=SUM(M3:M4)+M5', '=SUM(N3:N4)+N5',
        ]],
      },
    });

    expect(batchUpdateSpy).toHaveBeenCalledTimes(2);
    expect(updateSpy).toHaveBeenCalledTimes(4);
  });
});
