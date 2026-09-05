import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getSpreadsheetId', () => {
  beforeEach(() => {
    process.env.GOOGLE_SPREADSHEET_ID = 'test-sheet-id';
  });

  it('reads the spreadsheet id from env', async () => {
    const { getSpreadsheetId } = await import('./client');
    expect(getSpreadsheetId()).toBe('test-sheet-id');
  });

  it('throws a clear error when the env var is missing', async () => {
    delete process.env.GOOGLE_SPREADSHEET_ID;
    vi.resetModules();
    const { getSpreadsheetId } = await import('./client');
    expect(() => getSpreadsheetId()).toThrow('GOOGLE_SPREADSHEET_ID is not set');
  });
});
