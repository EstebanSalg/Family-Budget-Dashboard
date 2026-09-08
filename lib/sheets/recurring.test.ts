import { describe, it, expect, vi } from 'vitest';
import { advanceNextDueDate } from './recurring';
import { RECURRING_RANGE } from './layout';

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
    const updateSpy = vi.fn(async (_req: { requestBody: { values: string[][] } }) => ({ data: {} }));
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

  it('regression guard: fails if RECURRING_RANGE is too narrow to reach columns G-J', async () => {
    // Task 13's live migration added 4 new columns (NextDueDate, Frequency,
    // AutoLogEnabled, LastLoggedDate) after the original 6, making the real
    // sheet 10 columns wide (A-J). RECURRING_RANGE must extend through column
    // J to read them back. This test's mock mimics the real Sheets API: a
    // range that only extends to column F returns ONLY 6 columns of data,
    // even though the underlying sheet has 10 — exactly what would happen if
    // RECURRING_RANGE regressed back to `A2:F1001`. Unlike the mock above
    // (which returns a fixed 10-column row regardless of the requested
    // range), this one actually exercises the real, too-narrow range string.
    const fullHeader = ['Category', 'Item', 'ExpectedAmount', 'Keyword', 'Type', 'Notes', 'NextDueDate', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate'];
    const fullDataRow = ['🎬 Entertainment', 'Netflix', '$15.99', 'netflix', 'fixed', '', '2026-10-01', 'Weekly', 'TRUE', '2026-09-01'];

    const columnLetterToIndex = (letters: string) =>
      letters.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0); // 1-based, A=1

    const getSpy = vi.fn(async ({ range }: { range: string }) => {
      const endCol = range.match(/:([A-Z]+)\d+$/)?.[1] ?? 'Z';
      const endColIndex = columnLetterToIndex(endCol);
      return {
        data: {
          values: [fullHeader.slice(0, endColIndex), fullDataRow.slice(0, endColIndex)],
        },
      };
    });

    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: { values: { get: getSpy } },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { getRecurringItems } = await import('./recurring');

    const items = await getRecurringItems();

    // Sanity check: the production code really did request the live constant.
    expect(getSpy).toHaveBeenCalledWith(expect.objectContaining({ range: RECURRING_RANGE }));
    expect(items).toHaveLength(1);

    // These would silently fall back to hardcoded defaults ('2026-01-01',
    // 'Monthly', false, null) if RECURRING_RANGE were too narrow to reach
    // columns G-J. A regression to `A2:F1001` makes every one of these fail.
    expect(items[0].nextDueDate.toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(items[0].frequency).toBe('Weekly');
    expect(items[0].autoLogEnabled).toBe(true);
    expect(items[0].lastLoggedDate?.toISOString().slice(0, 10)).toBe('2026-09-01');
  });
});

describe('markLogged', () => {
  it('writes NextDueDate and LastLoggedDate to the row matching the item name, in one batchUpdate call', async () => {
    const batchUpdateSpy = vi.fn(async () => ({ data: {} }));
    vi.doMock('./client', () => ({
      getSheetsClient: vi.fn(async () => ({
        spreadsheets: {
          values: {
            get: vi.fn(async () => ({
              data: { values: [
                ['Category', 'Item', 'NextDueDate', 'ExpectedAmount', 'Frequency', 'AutoLogEnabled', 'LastLoggedDate'],
                ['🏠 Housing', 'Rent', '2026-09-01', '2650', 'Monthly', 'TRUE', ''],
              ] },
            })),
            batchUpdate: batchUpdateSpy,
          },
        },
      })),
      getSpreadsheetId: vi.fn(() => 'test-id'),
    }));
    vi.resetModules();
    const { markLogged } = await import('./recurring');

    await markLogged('Rent', new Date('2026-10-01'), new Date('2026-09-05'));

    // Real schema (Task 3 discovery): column A is "Category", not "Name" — the
    // item's identifying name is in the "Item" column, and the real header row
    // is RECURRING_HEADER_ROW (2, from lib/sheets/layout.ts), not row 1. "Rent"
    // is the data row right after the header, i.e. sheet row 3.
    //
    // Deviation from the Task 15 brief's originally-specified assertion (a
    // single update over range C3:G3): live verification against the real
    // dev sheet showed that shape corrupts data. NextDueDate and
    // LastLoggedDate are not adjacent columns in the real 10-column sheet
    // (NextDueDate=G, Frequency=H, AutoLogEnabled=I, LastLoggedDate=J) — this
    // mock header reproduces that same non-adjacency, with ExpectedAmount,
    // Frequency and AutoLogEnabled sitting between NextDueDate (C) and
    // LastLoggedDate (G). A single values.update over C3:G3 with only two
    // values writes them starting at the range's top-left cell and leaves
    // the rest of the range untouched (Sheets does not clear/skip
    // in-between cells) — confirmed live: it silently overwrote
    // ExpectedAmount/Frequency with the logged-on date and left
    // LastLoggedDate blank.
    //
    // Task 15 fix-round: two sequential values.update calls are not atomic —
    // if the first succeeds and the second fails, NextDueDate advances while
    // LastLoggedDate stays stale. markLogged now issues a single
    // values.batchUpdate call carrying both single-cell ranges in its `data`
    // array, so both cells land in one HTTP request.
    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);
    expect(batchUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: 'test-id',
        requestBody: expect.objectContaining({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: expect.stringContaining('C3'),
              values: [['2026-10-01']],
            },
            {
              range: expect.stringContaining('G3'),
              values: [['2026-09-05']],
            },
          ],
        }),
      })
    );
  });
});
