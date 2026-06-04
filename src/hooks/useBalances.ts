import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { formatEther } from 'viem';
import { calculateGroupBalancesFromOnchain } from '@/lib/balanceEngine';

export const useBalances = (groupId: string) => {
  const { publicClient } = useWallet();
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!groupId || !publicClient) return;
    setLoading(true);

    try {
      const groupData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'getGroup',
        args: [BigInt(groupId)],
      });

      const [, , members] = groupData as [string, string, string[], bigint];

      const onchainBalances: Record<string, number> = {};
      const balancePromises = members.map(async (member) => {
        try {
          const balanceWei = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: SPLIT_ABI,
            functionName: 'getMemberBalance',
            args: [BigInt(groupId), member as `0x${string}`],
          });
          onchainBalances[member.toLowerCase()] = parseFloat(formatEther(balanceWei as bigint));
        } catch (innerErr) {
          console.error(`Error fetching balance for member ${member}:`, innerErr);
          onchainBalances[member.toLowerCase()] = 0;
        }
      });

      await Promise.all(balancePromises);

      const calculatedBalances = calculateGroupBalancesFromOnchain(onchainBalances);
      setBalances(calculatedBalances);
    } catch (err) {
      console.error('Error fetching onchain balances:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, publicClient]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const refreshBalances = async () => {
    await fetchBalances();
  };

  return { balances, loading, refreshBalances };
};
