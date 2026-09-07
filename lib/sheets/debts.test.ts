import { describe, it, expect, vi } from 'vitest';
import { matchPayments, estimatePayoffDate } from './debts';
import type { Transaction } from './expenseLog';
import type { Debt } from './debts';

function tx(description: string, amount: number): Transaction {
  return { date: new Date('2026-06-11'), amount, category: '🚗 Transport', description, source: 'Bank', month: 'Jun', year: 2026 };
}

const carLoan: Debt = {
  name: 'Car Loan',
  principal: 20000,
  currentBalance: 12000,
  payment: 323.98,
  frequency: 'Biweekly',
  startDate: new Date('2024-01-01'),
  rate: 6.5,
  keyword: 'LendCare',
};

describe('matchPayments', () => {
  it('matches transactions whose description contains the keyword, case-insensitively', () => {
    const transactions = [
      tx('LendCare car loan payment', 323.98),
      tx('Costco Wholesale Nepean', 175.04),
      tx('lendcare monthly payment', 323.98),
    ];
    const matches = matchPayments(carLoan, transactions);
    expect(matches).toHaveLength(2);
  });
});

describe('estimatePayoffDate', () => {
  it('returns null when payment is zero (can never pay off)', () => {
    expect(estimatePayoffDate({ ...carLoan, payment: 0 })).toBeNull();
  });

  it('estimates a future date based on balance / payment and frequency', () => {
    const result = estimatePayoffDate({ ...carLoan, currentBalance: 647.96, payment: 323.98, frequency: 'Biweekly' });
    expect(result).not.toBeNull();
    // 647.96 / 323.98 = 2 payments remaining, biweekly = 28 days out from today
    const daysFromNow = Math.round((result!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(daysFromNow).toBeGreaterThanOrEqual(27);
    expect(daysFromNow).toBeLessThanOrEqual(29);
  });
});
