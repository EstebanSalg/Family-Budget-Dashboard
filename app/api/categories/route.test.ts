// app/api/categories/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const addCategorySpy = vi.fn(async () => undefined);

vi.mock('@/lib/sheets/budgets', () => ({
  addCategory: addCategorySpy,
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/categories', () => {
  beforeEach(() => {
    addCategorySpy.mockClear();
  });

  it('rejects a category name containing a quotation mark with 400 and never calls addCategory', async () => {
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ emoji: '🎉', name: 'Mom\'s "fun" money', startingBudget: 10 }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/quotation mark/i);
    expect(addCategorySpy).not.toHaveBeenCalled();
  });

  it('rejects an emoji field containing a quotation mark with 400 and never calls addCategory', async () => {
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ emoji: '"', name: 'Fun Money', startingBudget: 10 }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/quotation mark/i);
    expect(addCategorySpy).not.toHaveBeenCalled();
  });

  it('accepts a category with no quotation marks and calls addCategory', async () => {
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ emoji: '🎮', name: 'Gaming', startingBudget: 50 }));

    expect(res.status).toBe(200);
    expect(addCategorySpy).toHaveBeenCalledWith({ emoji: '🎮', name: 'Gaming', startingBudget: 50 });
  });
});
