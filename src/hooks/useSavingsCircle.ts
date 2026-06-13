import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { SAVINGS_CIRCLE_ADDRESS, SAVINGS_CIRCLE_ABI, CUSD_ADDRESS } from '@/lib/contract';
import { celo } from 'viem/chains';
import { erc20Abi } from 'viem';

export const useSavingsCircle = (circleId?: string) => {
  const wallet = useWallet();
  const walletRef = useRef(wallet);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const { address, walletClient, publicClient } = wallet;
  const [circles, setCircles] = useState<any[]>([]);
  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Helper to fetch the list of all circles the user is a member of
  const fetchCircles = useCallback(async () => {
    if (!publicClient || !SAVINGS_CIRCLE_ADDRESS) {
      setLoading(false);
      return;
    }
    if (!publicClient || !SAVINGS_CIRCLE_ADDRESS) return;
    setLoading(true);

    try {
      // 1. Get circleCount
      const count = await publicClient.readContract({
        address: SAVINGS_CIRCLE_ADDRESS,
        abi: SAVINGS_CIRCLE_ABI,
        functionName: 'circleCount',
      }) as bigint;

      const totalCircles = Number(count);
      if (totalCircles === 0) {
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

      const allCircles = (await Promise.all(circlePromises)).filter(Boolean);

      // 3. Filter circles by user membership if wallet is connected
      if (address) {
        const userAddress = address.toLowerCase();
        const userCircles = allCircles.filter((c: any) => 
          c.memberAddrs.some((m: string) => m.toLowerCase() === userAddress)
        );
        setCircles(userCircles);
      } else {
        setCircles(allCircles);
      }
    } catch (err) {
      console.error('Failed to fetch savings circles:', err);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  // Helper to fetch a single circle details + member details
  const fetchCircleDetails = useCallback(async () => {
    if (!publicClient || !circleId || !SAVINGS_CIRCLE_ADDRESS) {
      setLoading(false);
      return;
    }

    if (!publicClient || !circleId || !SAVINGS_CIRCLE_ADDRESS) return;
    setLoading(true);

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
      setMembers(memberDetails);
    } catch (err) {
      console.error(`Failed to fetch circle ${circleId} details:`, err);
      setCircle(null);
    } finally {
      setLoading(false);
    }
  }, [circleId, publicClient]);

  // gasPrice always set (CELO). feeCurrency only for MiniPay, which holds no CELO.
  const buildGasParams = async (publicClient: any, isMiniPay: boolean) => {
    const gasPrice = await publicClient.getGasPrice();
    return {
      gasPrice,
      feeCurrency: isMiniPay ? (CUSD_ADDRESS as `0x${string}`) : undefined,
    };
  };

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
      await fetchCircleDetails();
      return { tx, receipt };
    } catch (err: any) {
      console.error('Failed to join circle:', err);
      setTxError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setTxLoading(false);
    }
  };

  // CONTRIBUTE TO CIRCLE — approve cUSD first, then contribute
  const contribute = async (amount: bigint) => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient || !circleId) throw new Error('Wallet not connected');
    setTxLoading(true);
    setTxError(null);

    try {
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      // No explicit nonce — let the wallet manage it. We await the approve
      // receipt before contributing, so the wallet sequences both correctly.
      // Step 1: Approve cUSD spend
      const approveTx = await walletClient.writeContract({
        address: CUSD_ADDRESS,
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
      await fetchCircleDetails();
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
      await fetchCircleDetails();
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
      await fetchCircleDetails();
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
      await fetchCircleDetails();
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
      await fetchCircleDetails();
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
      await fetchCircleDetails();
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
    refreshCircles: fetchCircles,
    refreshCircle: fetchCircleDetails,
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
