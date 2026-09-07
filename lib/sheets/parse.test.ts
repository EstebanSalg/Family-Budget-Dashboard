import { describe, it, expect } from 'vitest';
import { parseCurrency, formatCurrency, parseSheetDate } from './parse';

describe('parseCurrency', () => {
  it('parses plain numbers', () => {
    expect(parseCurrency('42.50')).toBe(42.5);
  });
  it('strips thousands separators', () => {
    expect(parseCurrency('3,200.00')).toBe(3200);
  });
  it('strips a leading dollar sign', () => {
    expect(parseCurrency('$1,500.00')).toBe(1500);
  });
  it('treats a blank cell as zero', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency('-')).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats with two decimals and a dollar sign', () => {
    expect(formatCurrency(1500)).toBe('$1,500.00');
  });
});

describe('parseSheetDate', () => {
  it('parses an ISO date string', () => {
    const d = parseSheetDate('2026-04-15');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3); // 0-indexed
    expect(d.getUTCDate()).toBe(15);
  });
});
