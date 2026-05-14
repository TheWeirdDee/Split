"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, CUSD_ADDRESS, SPLIT_ABI, generateGroupId } from '@/lib/contract';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { celo } from '@/constants/chains';

import { 
  Users, Pizza, Car, House, PartyPopper, Plane, 
  ShoppingCart, Coffee, Music, Coins, Beer, 
  Popcorn, Lightbulb, Gamepad2, Volleyball, 
  Gift, Mountain, Umbrella, CookingPot, Trophy 
} from 'lucide-react';

const ICONS = [
  { id: 'Users', label: 'General' },
  { id: 'Pizza', label: 'Food' },
  { id: 'Car', label: 'Transport' },
  { id: 'House', label: 'Home' },
  { id: 'PartyPopper', label: 'Events' },
  { id: 'Plane', label: 'Travel' },
  { id: 'ShoppingCart', label: 'Shopping' },
  { id: 'Coffee', label: 'Drinks' },
  { id: 'Music', label: 'Music' },
  { id: 'Coins', label: 'Money' },
  { id: 'Beer', label: 'Social' },
  { id: 'Popcorn', label: 'Movies' },
  { id: 'Lightbulb', label: 'Ideas' },
  { id: 'Gamepad2', label: 'Gaming' },
  { id: 'Volleyball', label: 'Sports' },
  { id: 'Gift', label: 'Gifts' },
  { id: 'Mountain', label: 'Outdoors' },
  { id: 'Umbrella', label: 'Beach' },
  { id: 'CookingPot', label: 'Cooking' },
  { id: 'Trophy', label: 'Competition' },
];

const IconMap: Record<string, any> = {
  Users, Pizza, Car, House, PartyPopper, Plane, 
  ShoppingCart, Coffee, Music, Coins, Beer, 
  Popcorn, Lightbulb, Gamepad2, Volleyball, 
  Gift, Mountain, Umbrella, CookingPot, Trophy
};

export default function CreateGroupPage() {
  const router = useRouter();
  const { address, walletClient, publicClient } = useWallet();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('Users');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!address || !name) return;
    setLoading(true);

    try {
      const groupId = uuidv4();
      const groupIdBytes = generateGroupId(groupId);

      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'createGroup',
        args: [groupIdBytes],
        chain: celo,
        account: address,
        feeCurrency: CUSD_ADDRESS,
        type: 'cip42',
        gas: BigInt(200000),
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
      <AppHeader />
      
      <div className="px-6 pt-24 pb-48 space-y-10">
        {step === 1 ? (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="clash-display font-bold text-2xl">Pick an emoji</h2>
              <div className="grid grid-cols-5 gap-3">
                {ICONS.map((item) => {
                  const Icon = IconMap[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEmoji(item.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all",
                        emoji === item.id ? "bg-brand/10 border-brand scale-105 shadow-lg shadow-brand/10" : "bg-surface border-border hover:border-text-muted"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl",
                        emoji === item.id ? "text-brand" : "text-text-secondary"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
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

            {/* Forced recompile comment */}
            <Button 
              size="lg" 
              style={{
                width: '100%',
                height: '56px',
                background: '#00C896',
                color: '#000000',
                fontSize: '18px',
                fontWeight: '700',
                borderRadius: '16px',
                marginTop: '32px',
                border: 'none',
                cursor: name ? 'pointer' : 'not-allowed',
                opacity: name ? 1 : 0.5
              }}
              disabled={!name || loading}
              onClick={() => handleCreate()}
              loading={loading}
            >
              {loading ? 'Creating Onchain (cUSD gas)...' : 'Create Group'}
            </Button>
            
            {/* Massive spacer to ensure button clears the BottomNav */}
            <div className="h-[120px] w-full shrink-0" />
          </div>
        ) : null}
      </div>
    </>
  );
}
