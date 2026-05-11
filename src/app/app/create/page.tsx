"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, SPLIT_ABI, generateGroupId } from '@/lib/contract';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { celo } from '@/constants/chains';

const EMOJIS = ['👥', '🍕', '🚗', '🏠', '🎉', '✈️', '🛒', '☕', '🎵', '💰', '🍻', '🍿', '💡', '🎮', '🏀', '🎁', '🎾', '🏖️', '⛰️', '🌮'];

export default function CreateGroupPage() {
  const router = useRouter();
  const { address, walletClient, publicClient } = useWallet();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!address || !name) return;
    setLoading(true);

    try {
      const groupId = uuidv4();
      const groupIdBytes = generateGroupId(groupId);

      const gasPrice = await publicClient.getGasPrice();
      const nonce = await publicClient.getTransactionCount({ address, blockTag: 'pending' });

      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'createGroup',
        args: [groupIdBytes],
        chain: celo,
        account: address,
        gasPrice,
        nonce,
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });

      const { error: groupError } = await supabase.from('groups').insert({
        id: groupId,
        name,
        emoji,
        description,
        created_by: address.toLowerCase(),
        onchain_tx: tx,
      });

      if (groupError) throw groupError;

      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: groupId,
        wallet_address: address.toLowerCase(),
        onchain_tx: tx,
      });

      if (memberError) throw memberError;

      router.push(`/app/group/${groupId}`);
    } catch (err) {
      console.error('Group creation failed:', err);
      alert('Failed to create group onchain. Please check your balance and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader title="New Group" showBack />
      
      <div className="px-6 pt-24 pb-12 space-y-10">
        {step === 1 ? (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="clash-display font-bold text-2xl">Pick an emoji</h2>
              <div className="grid grid-cols-5 gap-3">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all",
                      emoji === e ? "bg-brand/10 border-brand scale-110 shadow-lg shadow-brand/10" : "bg-surface border-border hover:border-text-muted"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <Input 
                label="Group Name" 
                placeholder="e.g. Ski Trip 2024" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input 
                label="Description (Optional)" 
                placeholder="What's this group for?" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold rounded-2xl mt-8"
              disabled={!name}
              onClick={() => handleCreate()}
              loading={loading}
            >
              {loading ? 'Creating Onchain...' : 'Create Group'}
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
