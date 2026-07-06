import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { SAVINGS_CIRCLE_ADDRESS, SAVINGS_CIRCLE_ABI, usdm_ADDRESS } from '@/lib/contract';
import { buildGasParams } from '@/lib/gas';
import { getCached, setCached, clearCached } from '@/lib/onchainCache';
import type { SavingsCircle, SavingsMember } from '@/types/models';
import { celo } from 'viem/chains';
import { erc20Abi } from 'viem';
import { supabase } from '@/lib/supabase';

/**
 * On-chain interface to the SavingsCircle contract: lists circles and, when a
 * `circleId` is given, exposes that circle's detail plus member actions
 * (create / join / contribute / distribute). Follows the project gas rule —
 * gasPrice in CELO, `feeCurrency: usdm` only for MiniPay.
 *
 * @param circleId optional circle to load detail/actions for.
 */
export const useSavingsCircle = (circleId?: string) => {
  const wallet = useWallet();
  const walletRef = useRef(wallet);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const { address, publicClient } = wallet;
  const [circles, setCircles] = useState<SavingsCircle[]>([]);
  const [circle, setCircle] = useState<SavingsCircle | null>(null);
  const [members, setMembers] = useState<SavingsMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Helper to fetch the list of all circles the user is a member of.
  // Uses a short-lived module cache so navigating between Home/Explore/Save
  // doesn't re-read every circle from the RPC each time. `force` (manual
  // refresh / post-mutation) bypasses the cache.
  const fetchCircles = useCallback(async (opts?: { force?: boolean }) => {
    if (!publicClient || !SAVINGS_CIRCLE_ADDRESS) {
      setLoading(false);
      return;
    }

    const cacheKey = `circles:${address?.toLowerCase() || 'all'}`;
    const { data: cached, fresh } = getCached<SavingsCircle[]>(cacheKey, 30_000);
    if (cached) {
      setCircles(cached);
      setLoading(false);
      if (fresh && !opts?.force) return; // fresh enough — skip the RPC round-trip
    } else {
      setLoading(true);
    }

    try {
      // 1. Get circleCount
      const count = await publicClient.readContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'circleCount',
      }) as bigint;

      const totalCircles = Number(count);
      if (totalCircles === 0) {
        setCached(cacheKey, []);
        setCircles([]);
        setLoading(false);
        return;
      }

      // 2. Fetch all circles in parallel
      const circlePromises = Array.from({ length: totalCircles }, (_, i) => {
        const id = i + 1;
        return Promise.all([
          publicClient.readContract({
            address: SAVINGS_CIRCLE_ADDRESS,
            abi: SAVINGS_CIRCLE_ABI,
            functionName: 'getCircle',
            args: [BigInt(id)],
          }),
          publicClient.readContract({
            address: SAVINGS_CIRCLE_ADDRESS,
            abi: SAVINGS_CIRCLE_ABI,
            functionName: 'circles',
            args: [BigInt(id)],
          }).catch(() => null)
        ]).then(([res, circlesRes]: [any, any]) => {
          const configObj = circlesRes ? circlesRes[2] : null;
          const goalAmount = configObj && typeof configObj === 'object'
            ? (configObj.goalAmount !== undefined ? configObj.goalAmount : configObj[8])
            : BigInt(0);

          return {
            id,
            name: res[0],
            mode: res[1],
            status: res[2],
            contributionAmount: res[3],
            currentPot: res[4],
            currentCycle: res[5],
            nextDeadline: res[6],
            totalSaved: res[7],
            memberAddrs: res[8],
            creator: circlesRes ? circlesRes[1] : '',
            config: {
              goalAmount: goalAmount,
            }
          };
        }).catch((err: any) => {
          console.error(`Failed to fetch circle ${id}:`, err);
          return null;
        });
      });

      const allCircles = (await Promise.all(circlePromises)).filter(
        (c): c is SavingsCircle => c !== null
      );

      // 3. Filter circles by user membership if wallet is connected
      const result = address
        ? allCircles.filter((c) =>
            c.memberAddrs.some((m: string) => m.toLowerCase() === address.toLowerCase())
          )
        : allCircles;
      setCached(cacheKey, result);
      setCircles(result);
    } catch (err) {
      console.error('Failed to fetch savings circles:', err);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  // Helper to fetch a single circle's details + member details (cached; `force`
  // bypasses the cache after a mutation / manual refresh).
  const fetchCircleDetails = useCallback(async (opts?: { force?: boolean }) => {
    if (!publicClient || !circleId || !SAVINGS_CIRCLE_ADDRESS) {
      setLoading(false);
      return;
    }

    const cacheKey = `circle:${circleId}`;
    const { data: cachedDetail, fresh } = getCached<{ circle: SavingsCircle; members: SavingsMember[] }>(cacheKey, 20_000);
    if (cachedDetail) {
      setCircle(cachedDetail.circle);
      setMembers(cachedDetail.members);
      setLoading(false);
      if (fresh && !opts?.force) return;
    } else {
      setLoading(true);
    }

    try {
      const id = BigInt(circleId);
      
      // Fetch circle info
      const res: any = await publicClient.readContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'getCircle',
        args: [id],
      });

      // Fetch creator and configuration info from the public mapping
      const circlesRes: any = await publicClient.readContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'circles',
        args: [id],
      });

      const configObj = circlesRes[2];
      const goalAmount = configObj && typeof configObj === 'object'
        ? (configObj.goalAmount !== undefined ? configObj.goalAmount : configObj[8])
        : BigInt(0);

      const circleData = {
        id: Number(circleId),
        name: res[0],
        mode: res[1], // 0 = Rotating, 1 = Goal
        status: res[2], // 0 = Active, 1 = Completed, 2 = Dissolved
        contributionAmount: res[3],
        currentPot: res[4],
        currentCycle: res[5],
        nextDeadline: res[6],
        totalSaved: res[7],
        memberAddrs: res[8],
        creator: circlesRes[1],
        rotationIndex: circlesRes[6],
        config: {
          goalAmount: goalAmount,
        },
      };

      setCircle(circleData);

      // Fetch details for each member in the circle
      const memberPromises = circleData.memberAddrs.map(async (mAddr: string) => {
        const statusRes: any = await publicClient.readContract({
          address: SAVINGS_CIRCLE_ADDRESS,
          abi: SAVINGS_CIRCLE_ABI,
          functionName: 'getMemberStatus',
          args: [id, mAddr],
        });

        const hasContributed = await publicClient.readContract({
          address: SAVINGS_CIRCLE_ADDRESS,
          abi: SAVINGS_CIRCLE_ABI,
          functionName: 'hasContributedThisCycle',
          args: [id, mAddr],
        });

        return {
          address: mAddr,
          missedCount: Number(statusRes[0]),
          totalContributed: statusRes[1],
          totalReceived: statusRes[2],
          status: statusRes[3], // 0 = Active, 1 = Skipped, 2 = Removed, 3 = Exited
          hasReceivedPayout: statusRes[4],
          hasContributedThisCycle: hasContributed,
        };
      });

      const memberDetails = await Promise.all(memberPromises);
      setCached(cacheKey, { circle: circleData, members: memberDetails });
      setMembers(memberDetails);
    } catch (err) {
      console.error(`Failed to fetch circle ${circleId} details:`, err);
      setCircle(null);
    } finally {
      setLoading(false);
    }
  }, [circleId, publicClient]);


  // CREATE CIRCLE
  const createCircle = async (
    name: string,
    mode: number,
    contributionAmount: bigint,
    frequency: bigint,
    gracePeriod: bigint,
    maxMissed: number,
    maxMembers: bigint,
    maxCycles: bigint,
    goalAmount: bigint,
    goalDeadline: bigint,
    reminderLeadTime: bigint
  ) => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient) throw new Error('Wallet not connected');
    // Both contract addresses come from NEXT_PUBLIC_* env. If the savings address
    // is missing in this build (e.g. the env var isn't set in the Vercel/prod
    // environment) the write would silently target `undefined` and fail — which
    // looks like "groups work, savings doesn't". Fail with a clear message instead.
    if (!SAVINGS_CIRCLE_ADDRESS) {
      throw new Error('Savings circle contract address is not configured (NEXT_PUBLIC_SAVINGS_CIRCLE_ADDRESS missing for this deployment).');
    }
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'createCircle',
        args: [name, mode, contributionAmount, frequency, gracePeriod, maxMissed, maxMembers, maxCycles, goalAmount, goalDeadline, reminderLeadTime],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles'); // new circle must show up on the next list view
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to create circle:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // JOIN CIRCLE
  const joinCircle = async () => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'joinCircle',
        args: [BigInt(circleId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles');
      await fetchCircleDetails({ force: true });
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to join circle:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // CONTRIBUTE TO CIRCLE — approve usdm first, then contribute
  const contribute = async (amount: bigint) => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      // No explicit nonce — let the wallet manage it. We await the approve
      // receipt before contributing, so the wallet sequences both correctly.
      // Step 1: Approve usdm spend
      const approveTx = await walletClient.writeContract({
        address: usdm_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SAVINGS_CIRCLE_ADDRESS, amount],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Step 2: Contribute
      const contributeTx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'contribute',
        args: [BigInt(circleId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: contributeTx });
      clearCached('circles');
      
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('trust_score, on_time_contributions')
          .eq('wallet_address', address.toLowerCase())
          .maybeSingle();

        const currentScore = profile?.trust_score ?? 680;
        const currentContribs = profile?.on_time_contributions ?? 0;
        const newScore = Math.min(990, currentScore + 15);

        await supabase
          .from('user_profiles')
          .update({
            trust_score: newScore,
            on_time_contributions: currentContribs + 1,
          })
          .eq('wallet_address', address.toLowerCase());
      } catch (dbErr) {
        console.error('Failed to update trust score on contribution:', dbErr);
      }

      await fetchCircleDetails({ force: true });
      return { tx: contributeTx, receipt };
    } catch (err: any) {
      console.error('Failed to contribute to circle:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // DISTRIBUTE (Rotating mode pot distribution)
  const distribute = async () => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'distribute',
        args: [BigInt(circleId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles');
      await fetchCircleDetails({ force: true });
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to distribute pot:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // DISTRIBUTE GOAL (Goal mode pot distribution)
  const distributeGoal = async () => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'distributeGoal',
        args: [BigInt(circleId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles');
      await fetchCircleDetails({ force: true });
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to distribute goal pot:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // MARK MISSED MEMBER
  const markMissed = async (memberAddr: string) => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'markMissed',
        args: [BigInt(circleId), memberAddr as `0x${string}`],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles');
      await fetchCircleDetails({ force: true });
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to mark member missed:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // EXIT CIRCLE
  const exitCircle = async () => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'exitCircle',
        args: [BigInt(circleId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles');
      await fetchCircleDetails({ force: true });
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to exit circle:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // DISSOLVE CIRCLE
  const dissolveCircle = async () => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      const tx = await walletClient.writeContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'dissolveCircle',
        args: [BigInt(circleId)],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      clearCached('circles');
      await fetchCircleDetails({ force: true });
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to dissolve circle:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (circleId) {
      fetchCircleDetails();
    } else {
      fetchCircles();
    }
  }, [circleId, fetchCircles, fetchCircleDetails]);

  return {
    circles,
    circle,
    members,
    loading,
    txLoading,
    txError,
    refreshCircles: () => fetchCircles({ force: true }),
    refreshCircle: () => fetchCircleDetails({ force: true }),
    createCircle,
    joinCircle,
    contribute,
    distribute,
    distributeGoal,
    markMissed,
    exitCircle,
    dissolveCircle,
  };
};
