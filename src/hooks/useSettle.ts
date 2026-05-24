import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { supabase } from '@/lib/supabase';
import { CONTRACT_ADDRESS, CUSD_ADDRESS, SPLIT_ABI, generateGroupId } from '@/lib/contract';
import { parseEther, erc20Abi } from 'viem';
import { celo } from 'viem/chains';

export const useSettle = () => {
  const { address, walletClient, publicClient, refreshBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'sending' | 'confirmed'>('idle');

  const settle = async (groupId: string, creditor: string, amount: number) => {
    if (!address || !walletClient || !publicClient) return null;
    
    setLoading(true);
    try {
      const amountRaw = parseEther(amount.toFixed(18));
      const groupIdBytes = generateGroupId(groupId);
      
      const gasPrice = await publicClient.getGasPrice();
      let nonce = await publicClient.getTransactionCount({ address, blockTag: 'pending' });

      setStep('approving');
      const approveTx = await walletClient.writeContract({
        address: CUSD_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountRaw],
        chain: celo,
        account: address as `0x${string}`,
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx });
      
      setStep('sending');
      const settleTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'settleDebt',
        args: [groupIdBytes, creditor as `0x${string}`, amountRaw],
        chain: celo,
        account: address as `0x${string}`,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: settleTx });
      
      const { error } = await supabase.from('settlements').insert({
        group_id: groupId,
        debtor: address.toLowerCase(),
        creditor: creditor.toLowerCase(),
        amount: amount,
        onchain_tx: settleTx,
      });

      if (error) throw error;

      const { data: profile } = await supabase.from('user_profiles').select('display_name').eq('wallet_address', address.toLowerCase()).single();
      const debtorName = profile?.display_name || 'Someone';

      const { error: notifError } = await supabase.from('notifications').insert({
        user_address: creditor.toLowerCase(),
        group_id: groupId,
        type: 'settlement',
        title: '💸 Payment Received',
        body: `${debtorName} paid you ${amount.toFixed(2)} cUSD`,
        actor: address.toLowerCase(),
        action_url: `/app/group/${groupId}`,
        is_read: false,
      });
      if (notifError) console.error(notifError);

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
