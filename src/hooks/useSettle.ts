import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { CONTRACT_ADDRESS, usdm_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { buildGasParams } from '@/lib/gas';
import { parseEther, erc20Abi } from 'viem';
import { celo } from 'viem/chains';
import { createNotificationSafe } from '@/lib/notifications';

/**
 * Settles a debt on-chain: approves usdm, calls `settleDebt`, then notifies the
 * creditor. Exposes a `step` state ('approving' | 'sending' | 'confirmed') for
 * progress UI. Gas follows the project rule — gasPrice in CELO always, with
 * `feeCurrency: usdm` only for MiniPay (which holds no CELO).
 */
export const useSettle = () => {
  const wallet = useWallet();
  const walletRef = useRef(wallet);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'sending' | 'confirmed'>('idle');

  const settle = async (groupId: string, creditor: string, amount: number) => {
    const { address, walletClient, publicClient, refreshBalance, isMiniPay } = walletRef.current;
    if (!address || !walletClient || !publicClient) return null;

    setLoading(true);
    try {
      const amountRaw = parseEther(amount.toFixed(18));
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      // We await the approve receipt before settling, so the wallet sequences both correctly.
      setStep('approving');
      const approveTx = await walletClient.writeContract({
        address: usdm_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountRaw],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      setStep('sending');
      const settleTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'settleDebt',
        args: [BigInt(groupId), creditor as `0x${string}`, amountRaw],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: settleTx });

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle();
      const debtorName = profile?.display_name || 'Someone';

      await createNotificationSafe({
        userAddress: creditor.toLowerCase(),
        groupId,
        type: 'settlement',
        title: 'Payment Received',
        body: `${debtorName} paid you ${amount.toFixed(2)} usdm`,
        actor: address.toLowerCase(),
        actionUrl: `/app/group/${groupId}`,
      });

      setStep('confirmed');
      await refreshBalance();
      return settleTx;
    } catch (err) {
      console.error('Settlement failed:', err);
      setStep('idle');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { settle, loading, step };
};
