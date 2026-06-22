import { parseEther } from 'viem';

export type SplitType = 'equal' | 'percentage' | 'share' | 'exact';

/**
 * Computes each participant's share (in wei) of a total expense for a given
 * split strategy. The last participant absorbs any rounding remainder so the
 * shares always sum exactly to `totalAmountWei`.
 */
export function getSplitAmountsWei(
  totalAmountWei: bigint,
  splitWith: string[],
  splitType: SplitType,
  splitValues: Record<string, string>
): bigint[] {
  if (splitWith.length === 0) return [];

  if (splitType === 'percentage') {
    let sumWei = 0n;
    return splitWith.map((addr, index) => {
      if (index === splitWith.length - 1) {
        const remaining = totalAmountWei - sumWei;
        return remaining > 0n ? remaining : 0n;
      }
      const pct = parseFloat(splitValues[addr] || '0');
      const bps = BigInt(Math.round(pct * 100));
      const amt = (totalAmountWei * bps) / 10000n;
      sumWei += amt;
      return amt;
    });
  }

  if (splitType === 'share') {
    const shares = splitWith.map(addr => parseFloat(splitValues[addr] || '1'));
    const totalShares = shares.reduce((a, b) => a + b, 0);
    if (totalShares <= 0) {
      const memberCount = BigInt(splitWith.length);
      const baseShare = totalAmountWei / memberCount;
      const remainder = totalAmountWei % memberCount;
      return splitWith.map((_, index) => index < remainder ? baseShare + 1n : baseShare);
    }
    let sumWei = 0n;
    const totalSharesBps = BigInt(Math.round(totalShares * 100));
    return splitWith.map((addr, index) => {
      if (index === splitWith.length - 1) {
        const remaining = totalAmountWei - sumWei;
        return remaining > 0n ? remaining : 0n;
      }
      const sh = parseFloat(splitValues[addr] || '1');
      const shBps = BigInt(Math.round(sh * 100));
      const amt = (totalAmountWei * shBps) / totalSharesBps;
      sumWei += amt;
      return amt;
    });
  }

  if (splitType === 'exact') {
    let sumWei = 0n;
    return splitWith.map((addr, index) => {
      if (index === splitWith.length - 1) {
        const remaining = totalAmountWei - sumWei;
        return remaining > 0n ? remaining : 0n;
      }
      const val = splitValues[addr] || '0';
      const amt = parseEther(val || '0');
      sumWei += amt;
      return amt;
    });
  }

  // equal
  const memberCount = BigInt(splitWith.length);
  const baseShare = totalAmountWei / memberCount;
  const remainder = totalAmountWei % memberCount;
  return splitWith.map((_, index) => index < remainder ? baseShare + 1n : baseShare);
}
