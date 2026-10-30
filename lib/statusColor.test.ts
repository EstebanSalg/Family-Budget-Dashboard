// lib/statusColor.test.ts
import { describe, it, expect } from 'vitest';
import { getRatioStatus, getRatioColor, STATUS_COLORS } from './statusColor';

describe('getRatioStatus', () => {
  it('uses the sheet Status thresholds: >100% over, >85% warn, >0% ok, else none', () => {
    expect(getRatioStatus(1.18)).toBe('over');
    expect(getRatioStatus(1.0001)).toBe('over');
    expect(getRatioStatus(1)).toBe('warn'); // exactly 100% is "Near", not "Over"
    expect(getRatioStatus(0.86)).toBe('warn');
    expect(getRatioStatus(0.85)).toBe('ok'); // threshold is exclusive
    expect(getRatioStatus(0.01)).toBe('ok');
    expect(getRatioStatus(0)).toBe('none');
  });

  it('agrees with getRatioColor for the same ratio', () => {
    const colorFor = { over: STATUS_COLORS.red, warn: STATUS_COLORS.amber, ok: STATUS_COLORS.green, none: STATUS_COLORS.neutral };
    for (const ratio of [0, 0.4, 0.85, 0.9, 1, 1.4]) {
      expect(colorFor[getRatioStatus(ratio)]).toBe(getRatioColor(ratio));
    }
  });
});
