"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, CUSD_ADDRESS, SPLIT_ABI, generateGroupId } from '@/lib/contract';
import { truncateAddress } from '@/lib/utils';
import { celo } from 'viem/chains';
import { parseEther, erc20Abi } from 'viem';

export default function JoinGroupPage() {
  const router = useRouter();
  const { groupId } = useParams();
  const { address, walletClient, publicClient, connect, isConnected } = useWallet();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loadingText, setLoadingText] = useState('Joining Group (cUSD)...');

  useEffect(() => {
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .eq('id', groupId)
        .single();
      
      if (error) {
        console.error('Error fetching group:', error);
      } else {
        setGroup(data);
      }
      setLoading(false);
    };
    if (groupId) fetchGroup();
  }, [groupId]);

  const handleJoin = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (!address || !groupId) return;
    
    setJoining(true);
    try {
      const groupIdBytes = generateGroupId(groupId as string);

      const gasPrice = await publicClient.getGasPrice();
      let currentNonce = await publicClient.getTransactionCount({
        address: address as `0x${string}`,
        blockTag: 'pending'
      });

      // STEP 1: Volume Hack (Transfer tiny cUSD)
      setLoadingText('Initiating cUSD (Step 1/2)...');
      const transferTx = await walletClient.writeContract({
        address: CUSD_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [CONTRACT_ADDRESS as `0x${string}`, parseEther('0.0001')],
        chain: celo,
        account: address as `0x${string}`,
        feeCurrency: CUSD_ADDRESS as `0x${string}`,
        value: BigInt(0),
        gasPrice,
        nonce: currentNonce,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      });

      await publicClient.waitForTransactionReceipt({ hash: transferTx });

      // STEP 2: Join Group
      setLoadingText('Joining Group (Step 2/2)...');
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: SPLIT_ABI,
        functionName: 'joinGroup',
        args: [groupIdBytes],
        chain: celo,
        account: address as `0x${string}`,
        feeCurrency: CUSD_ADDRESS as `0x${string}`,
        value: BigInt(0),
        gasPrice,
        nonce: currentNonce + 1,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });

      // 2. Supabase Insert
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        wallet_address: address.toLowerCase(),
        display_name: displayName || null,
        onchain_tx: tx,
      });

      if (error && error.code !== '23505') throw error; // Ignore if already member

      // Notify creator
      if (group?.created_by && group.created_by.toLowerCase() !== address.toLowerCase()) {
        await supabase.from('notifications').insert({
          user_address: group.created_by.toLowerCase(),
          group_id: groupId,
          type: 'group_joined',
          title: '👋 New Member',
          body: `${displayName || 'Someone'} joined ${group.name}`,
          actor: address.toLowerCase(),
          action_url: `/app/group/${groupId}`,
          is_read: false,
        });
      }

      router.push(`/app/group/${groupId}`);
    } catch (err) {
      console.error('Joining failed:', err);
      alert('Failed to join group onchain.');
    } finally {
      setJoining(false);
      setLoadingText('Joining Group (cUSD)...');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" /></div>;

  if (!group) return <div className="p-8 text-center">Group not found.</div>;

  return (
    <>
      <AppHeader title="Join Group" showBack />
      
      <div className="px-6 pt-24 space-y-8 animate-fade-in">
        <Card className="p-8 text-center space-y-4">
          <div className="text-6xl mb-2">{group.emoji}</div>
          <h1 className="clash-display font-bold text-3xl">{group.name}</h1>
          <p className="text-text-secondary">{group.description || 'No description provided.'}</p>
          
          <div className="pt-4 flex flex-col items-center gap-1">
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Created by</span>
            <span className="text-sm dm-mono text-brand font-medium">{truncateAddress(group.created_by)}</span>
          </div>
        </Card>

        <div className="bg-surface-2 p-6 rounded-2xl border border-border space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Invitation details</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            You've been invited to join this group. Once joined, you can split bills and settle debts with other members using cUSD.
          </p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name (optional)"
            className="w-full rounded-2xl border border-[#2C2C2C] bg-[#121212] p-4 text-sm text-text-primary outline-none"
          />
        </div>

        <Button 
          size="lg" 
          className="w-full h-16 text-lg font-bold rounded-2xl"
          onClick={handleJoin}
          loading={joining}
        >
          {isConnected ? (joining ? loadingText : 'Join Group Now') : 'Connect Wallet to Join'}
        </Button>
      </div>
    </>
  );
}
