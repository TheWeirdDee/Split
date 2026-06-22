import { describe, it, expect } from 'vitest';
import { parseEther } from 'viem';
import { getSplitAmountsWei } from './split';

const sum = (xs: bigint[]) => xs.reduce((a, b) => a + b, 0n);

describe('getSplitAmountsWei', () => {
  const total = parseEther('100');
  const a = '0xaaa';
  const b = '0xbbb';
  const c = '0xccc';

  it('returns [] for no participants', () => {
    expect(getSplitAmountsWei(total, [], 'equal', {})).toEqual([]);
  });

  it('splits equally and conserves the total (with remainder)', () => {
    const res = getSplitAmountsWei(parseEther('10'), [a, b, c], 'equal', {});
    expect(sum(res)).toBe(parseEther('10'));
    expect(res.length).toBe(3);
  });

  it('handles an indivisible equal split exactly', () => {
    // 1 wei across 3 → remainder distributed, still sums to 1
    const res = getSplitAmountsWei(1n, [a, b, c], 'equal', {});
    expect(sum(res)).toBe(1n);
  });

  it('splits by percentage and conserves the total', () => {
    const res = getSplitAmountsWei(total, [a, b], 'percentage', { [a]: '30', [b]: '70' });
    expect(sum(res)).toBe(total);
    expect(res[0]).toBe(parseEther('30'));
  });

  it('splits by share proportionally', () => {
    const res = getSplitAmountsWei(total, [a, b], 'share', { [a]: '1', [b]: '3' });
    expect(sum(res)).toBe(total);
    expect(res[0]).toBe(parseEther('25')); // 1 of 4 shares
  });

  it('falls back to equal when total shares are zero', () => {
    const res = getSplitAmountsWei(parseEther('9'), [a, b, c], 'share', { [a]: '0', [b]: '0', [c]: '0' });
    expect(sum(res)).toBe(parseEther('9'));
  });

  it('uses exact amounts, last absorbs remainder', () => {
    const res = getSplitAmountsWei(total, [a, b], 'exact', { [a]: '40', [b]: '60' });
    expect(sum(res)).toBe(total);
    expect(res[0]).toBe(parseEther('40'));
  });
});
