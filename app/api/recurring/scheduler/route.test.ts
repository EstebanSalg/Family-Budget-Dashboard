// app/api/recurring/scheduler/route.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RecurringItem } from '@/lib/sheets/recurring';

const getRecurringItemsSpy = vi.fn<[], Promise<RecurringItem[]>>();
const markLoggedSpy = vi.fn<[string, Date, Date], Promise<void>>();
const appendTransactionSpy = vi.fn(async () => undefined);

// computeDueRecurringLogs (used by the route) calls the real
// advanceNextDueDate, so it must be re-exported here alongside the mocked
// getRecurringItems/markLogged rather than mocking the whole module away.
vi.mock('@/lib/sheets/recurring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sheets/recurring')>();
  return {
    ...actual,
    getRecurringItems: getRecurringItemsSpy,
    markLogged: markLoggedSpy,
  };
});

vi.mock('@/lib/sheets/expenseLog', () => ({
  appendTransaction: appendTransactionSpy,
}));

function item(overrides: Partial<RecurringItem>): RecurringItem {
  return {
    name: 'Rent',
    category: '🏠 Housing',
    expectedAmount: 2650,
    frequency: 'Monthly',
    nextDueDate: new Date('2026-09-01'),
    autoLogEnabled: true,
    lastLoggedDate: null,
    ...overrides,
  };
}

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set('authorization', authHeader);
  return new Request('http://localhost/api/recurring/scheduler', { headers });
}

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

describe('GET /api/recurring/scheduler', () => {
  beforeEach(() => {
    getRecurringItemsSpy.mockReset();
    markLoggedSpy.mockReset();
    appendTransactionSpy.mockClear();
  });

  afterEach(() => {
    if (ORIGINAL_CRON_SECRET === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    }
  });

  it('fails closed with 500 when CRON_SECRET is not set, rather than authenticating "Bearer undefined"', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('./route');

    // Pre-fix, this exact header would have authenticated successfully
    // because `Bearer ${undefined}` === 'Bearer undefined'.
    const res = await GET(makeRequest('Bearer undefined'));

    expect(res.status).toBe(500);
    expect(getRecurringItemsSpy).not.toHaveBeenCalled();
  });

  it('rejects a request with the wrong secret when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'real-secret';
    const { GET } = await import('./route');

    const res = await GET(makeRequest('Bearer wrong-secret'));

    expect(res.status).toBe(401);
    expect(getRecurringItemsSpy).not.toHaveBeenCalled();
  });

  it('isolates a per-item failure: one item failing does not abort the rest, and both outcomes are reported', async () => {
    process.env.CRON_SECRET = 'real-secret';
    getRecurringItemsSpy.mockResolvedValue([
      item({ name: 'Rent', nextDueDate: new Date('2026-09-01') }),
      item({ name: 'Netflix', nextDueDate: new Date('2026-09-01') }),
    ]);
    markLoggedSpy.mockImplementation(async (name: string) => {
      if (name === 'Rent') throw new Error('Multiple recurring items named "Rent" found; cannot determine which row to update');
    });

    const { GET } = await import('./route');
    const res = await GET(makeRequest('Bearer real-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    // Both items still had appendTransaction/markLogged attempted -- the
    // failure on Rent must not have skipped Netflix.
    expect(appendTransactionSpy).toHaveBeenCalledTimes(2);
    expect(markLoggedSpy).toHaveBeenCalledTimes(2);
    expect(body.succeeded).toEqual(['Netflix']);
    expect(body.failed).toEqual([
      { name: 'Rent', error: expect.stringMatching(/multiple recurring items named "Rent"/i) },
    ]);
  });

  it('reports all items as succeeded when nothing fails', async () => {
    process.env.CRON_SECRET = 'real-secret';
    getRecurringItemsSpy.mockResolvedValue([item({ name: 'Rent', nextDueDate: new Date('2026-09-01') })]);
    markLoggedSpy.mockResolvedValue(undefined);

    const { GET } = await import('./route');
    const res = await GET(makeRequest('Bearer real-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ succeeded: ['Rent'], failed: [] });
  });
});
