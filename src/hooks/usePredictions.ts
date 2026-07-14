import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { PREDICTION_CONTRACT_ADDRESS, PREDICTION_ABI, usdm_ADDRESS } from '@/lib/contract';
import { buildGasParams } from '@/lib/gas';
import { parseEther, formatEther, erc20Abi } from 'viem';
import { celo } from 'viem/chains';
import type { PredictionMarket } from '@/types/models';

/**
 * Custom hook for managing prediction markets (Social Micro-Betting).
 * Supports both on-chain groups (via SplitPrediction.sol contract) and local groups (via localStorage).
 */
export const usePredictions = (groupId: string) => {
  const wallet = useWallet();
  const walletRef = useRef(wallet);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const [predictions, setPredictions] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPredictions = useCallback(async () => {
    if (!groupId) return;

    // 1. LOCAL STORAGE FALLBACK (Local/Offline Groups)
    if (groupId.startsWith('local-')) {
      setLoading(true);
      try {
        const localList = JSON.parse(localStorage.getItem('split_local_predictions') || '[]');
        const filtered = localList.filter((p: any) => p.groupId === groupId);

        const currentAddr = walletRef.current.address?.toLowerCase() || '0xlocal';

        const mapped: PredictionMarket[] = filtered.map((p: any) => {
          const yesBets = p.yesBets || {};
          const noBets = p.noBets || {};
          const claimed = p.claimed || {};

          const totalYesPool = Object.values(yesBets).reduce((acc: number, val: any) => acc + Number(val), 0);
          const totalNoPool = Object.values(noBets).reduce((acc: number, val: any) => acc + Number(val), 0);

          return {
            id: p.id,
            groupId: p.groupId,
            question: p.question,
            endTime: p.endTime,
            creator: p.creator,
            outcome: p.outcome,
            resolved: p.resolved,
            totalYesPool,
            totalNoPool,
            userYesBet: Number(yesBets[currentAddr] || 0),
            userNoBet: Number(noBets[currentAddr] || 0),
            hasClaimed: !!claimed[currentAddr],
          };
        });

        // Sort newest first
        mapped.sort((a, b) => b.endTime - a.endTime);
        setPredictions(mapped);
      } catch (err) {
        console.error('Failed to load local predictions:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. ON-CHAIN FETCH
    const { address, publicClient } = walletRef.current;
    if (!publicClient) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const countBig = await publicClient.readContract({
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_ABI,
        functionName: 'marketCount',
      });
      const count = Number(countBig);

      const fetchedList: PredictionMarket[] = [];
      const userAddress = address?.toLowerCase();

      for (let i = 1; i <= count; i++) {
        const marketData = await publicClient.readContract({
          address: PREDICTION_CONTRACT_ADDRESS,
          abi: PREDICTION_ABI,
          functionName: 'getMarket',
          args: [BigInt(i)],
        });

        const [id, mGroupId, question, endTime, creator, outcome, totalYesPool, totalNoPool, resolved] = marketData as [
          bigint, bigint, string, bigint, string, number, bigint, bigint, boolean
        ];

        // Filter by current group ID
        if (mGroupId.toString() !== groupId) continue;

        let userYesBet = 0;
        let userNoBet = 0;
        let hasClaimed = false;

        if (userAddress) {
          const userBetData = await publicClient.readContract({
            address: PREDICTION_CONTRACT_ADDRESS,
            abi: PREDICTION_ABI,
            functionName: 'getUserBet',
            args: [BigInt(i), userAddress as `0x${string}`],
          });
          const [yesBet, noBet, claimed] = userBetData as [bigint, bigint, boolean];
          userYesBet = parseFloat(formatEther(yesBet));
          userNoBet = parseFloat(formatEther(noBet));
          hasClaimed = claimed;
        }

        fetchedList.push({
          id: i.toString(),
          groupId: groupId,
          question,
          endTime: Number(endTime),
          creator: creator.toLowerCase(),
          outcome,
          resolved,
          totalYesPool: parseFloat(formatEther(totalYesPool)),
          totalNoPool: parseFloat(formatEther(totalNoPool)),
          userYesBet,
          userNoBet,
          hasClaimed,
        });
      }

      fetchedList.sort((a, b) => b.endTime - a.endTime);
      setPredictions(fetchedList);
    } catch (err) {
      console.error('Failed to load on-chain predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // CREATE PREDICTION
  const createPrediction = async (question: string, durationSeconds: number) => {
    setActionLoading(true);
    try {
      if (groupId.startsWith('local-')) {
        const localList = JSON.parse(localStorage.getItem('split_local_predictions') || '[]');
        const newMarket = {
          id: `local-pred-${Date.now()}`,
          groupId,
          question,
          endTime: Math.floor(Date.now() / 1000) + durationSeconds,
          creator: walletRef.current.address?.toLowerCase() || '0xlocal',
          outcome: 0,
          resolved: false,
          yesBets: {},
          noBets: {},
          claimed: {},
        };
        localStorage.setItem('split_local_predictions', JSON.stringify([newMarket, ...localList]));
        await fetchPredictions();
        return true;
      }

      const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
      if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

      const gasParams = await buildGasParams(publicClient, isMiniPay);
      const tx = await walletClient.writeContract({
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_ABI,
        functionName: 'createMarket',
        args: [BigInt(groupId), question, BigInt(durationSeconds)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchPredictions();
      return true;
    } catch (err) {
      console.error('Failed to create prediction market:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // PLACE BET
  const placeBet = async (marketId: string, isYes: boolean, amount: number) => {
    setActionLoading(true);
    try {
      if (groupId.startsWith('local-')) {
        const localList = JSON.parse(localStorage.getItem('split_local_predictions') || '[]');
        const currentAddr = walletRef.current.address?.toLowerCase() || '0xlocal';

        const updated = localList.map((p: any) => {
          if (p.id === marketId) {
            const bets = isYes ? (p.yesBets || {}) : (p.noBets || {});
            bets[currentAddr] = (Number(bets[currentAddr] || 0) + amount).toString();
            return {
              ...p,
              [isYes ? 'yesBets' : 'noBets']: bets,
            };
          }
          return p;
        });

        localStorage.setItem('split_local_predictions', JSON.stringify(updated));
        await fetchPredictions();
        return true;
      }

      const { address, walletClient, publicClient, isMiniPay, refreshBalance } = walletRef.current;
      if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

      const amountRaw = parseEther(amount.toString());
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      // Approve usdm for the prediction contract
      const approveTx = await walletClient.writeContract({
        address: usdm_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PREDICTION_CONTRACT_ADDRESS, amountRaw],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Place the bet
      const tx = await walletClient.writeContract({
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_ABI,
        functionName: 'placeBet',
        args: [BigInt(marketId), isYes, amountRaw],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: tx });
      await refreshBalance();
      await fetchPredictions();
      return true;
    } catch (err) {
      console.error('Failed to place bet:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // RESOLVE PREDICTION
  const resolvePrediction = async (marketId: string, outcome: number) => {
    setActionLoading(true);
    try {
      if (groupId.startsWith('local-')) {
        const localList = JSON.parse(localStorage.getItem('split_local_predictions') || '[]');
        const updated = localList.map((p: any) => {
          if (p.id === marketId) {
            return {
              ...p,
              outcome,
              resolved: true,
            };
          }
          return p;
        });
        localStorage.setItem('split_local_predictions', JSON.stringify(updated));
        await fetchPredictions();
        return true;
      }

      const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
      if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

      const gasParams = await buildGasParams(publicClient, isMiniPay);
      const tx = await walletClient.writeContract({
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_ABI,
        functionName: 'resolveMarket',
        args: [BigInt(marketId), outcome],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: tx });
      await fetchPredictions();
      return true;
    } catch (err) {
      console.error('Failed to resolve prediction market:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // CLAIM WINNINGS
  const claimWinnings = async (marketId: string) => {
    setActionLoading(true);
    try {
      if (groupId.startsWith('local-')) {
        const localList = JSON.parse(localStorage.getItem('split_local_predictions') || '[]');
        const currentAddr = walletRef.current.address?.toLowerCase() || '0xlocal';

        const updated = localList.map((p: any) => {
          if (p.id === marketId) {
            const claimedMap = p.claimed || {};
            claimedMap[currentAddr] = true;
            return {
              ...p,
              claimed: claimedMap,
            };
          }
          return p;
        });

        localStorage.setItem('split_local_predictions', JSON.stringify(updated));
        await fetchPredictions();
        return true;
      }

      const { address, walletClient, publicClient, isMiniPay, refreshBalance } = walletRef.current;
      if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');

      const gasParams = await buildGasParams(publicClient, isMiniPay);
      const tx = await walletClient.writeContract({
        address: PREDICTION_CONTRACT_ADDRESS,
        abi: PREDICTION_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(marketId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: tx });
      await refreshBalance();
      await fetchPredictions();
      return true;
    } catch (err) {
      console.error('Failed to claim prediction winnings:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    predictions,
    loading,
    actionLoading,
    createPrediction,
    placeBet,
    resolvePrediction,
    claimWinnings,
    refreshPredictions: fetchPredictions,
  };
};
