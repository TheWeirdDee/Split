"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, CUSD_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { cn } from '@/lib/utils';
import { decodeEventLog } from 'viem';
import { celo } from 'viem/chains';

import { 
  Users, Pizza, Car, House, PartyPopper, Plane, 
  ShoppingCart, Coffee, Music, Coins, Beer, 
  Popcorn, Lightbulb, Gamepad2, Volleyball, 
  Gift, Mountain, Umbrella, CookingPot, Trophy,
  Zap, Globe
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

/** Create-group flow (route `/app/create`): name, members, and group icon. */
export default function CreateGroupPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { requireConnection, address } = wallet;
  const walletRef = React.useRef(wallet);
  
  React.useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);
  const [step, setStep] = useState(1);
  const [groupMode, setGroupMode] = useState<'local' | 'onchain'>('local');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('Users');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Creating Onchain (cUSD)...');

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return; // require a non-empty group name in both modes

    if (groupMode === 'local') {
      setLoading(true);
      try {
        const localId = 'local-' + Date.now();
        const newGroup = {
          id: localId,
          name: trimmedName,
          emoji,
          description,
          created_by: address ? address.toLowerCase() : 'local-user',
          created_at: new Date().toISOString(),
          members: [
            {
              wallet_address: address ? address.toLowerCase() : 'local-user',
              display_name: 'You',
              avatar_emoji: '👤'
            }
          ]
        };
        const localGroups = JSON.parse(localStorage.getItem('split_local_groups') || '[]');
        localStorage.setItem('split_local_groups', JSON.stringify([...localGroups, newGroup]));
        router.push(`/app/group/${localId}`);
      } catch (err) {
        console.error(err);
        alert('Failed to create local group.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const { address: walletAddr, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!walletAddr) return;
    setLoading(true);

    try {
      const gasPrice = await publicClient.getGasPrice();
      // gasPrice always set (CELO). feeCurrency only for MiniPay, which holds no CELO.
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = {
        gasPrice,
        feeCurrency: isMiniPay ? ('0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`) : undefined,
      };

      setLoadingText('Creating Group...');
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: SPLIT_ABI,
        functionName: 'createGroup',
        args: [trimmedName, []],
        chain: celo,
        account: walletAddr as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

      let onchainGroupId = '';
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: SPLIT_ABI,
            eventName: 'GroupCreated',
            data: log.data,
            topics: log.topics,
          });
          if (decoded && decoded.args) {
            onchainGroupId = (decoded.args as any).groupId.toString();
            break;
          }
        } catch (e) {
      
        }
      }

      if (!onchainGroupId) {
         
        const count = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: SPLIT_ABI,
          functionName: 'groupCount',
        });
        onchainGroupId = count.toString();
      }

      const { error: groupError } = await supabase.from('groups').insert({
        id: onchainGroupId,
        name: trimmedName,
        emoji,
        description,
        created_by: walletAddr.toLowerCase(),
        onchain_tx: tx,
      });

      if (groupError) throw groupError;

      // Register the creator as a member so the group's member list (used by the
      // add-expense / split UI) isn't empty. Ignore conflicts on re-runs.
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: onchainGroupId,
        wallet_address: walletAddr.toLowerCase(),
        display_name: null,
      });
      if (memberError) console.error('Failed to add creator as member:', memberError);

      router.push(`/app/group/${onchainGroupId}`);
    } catch (err) {
      console.error('Group creation failed:', err);
      alert('Failed to create group onchain. Please check your balance and try again.');
    } finally {
      setLoading(false);
      setLoadingText('Creating Onchain (cUSD)...');
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
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A] ml-1">Group Type</label>
                <div className="flex bg-[#161616] p-1 border border-[#2C2C2C] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setGroupMode('local')}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                      groupMode === 'local' ? "bg-[#00C896] text-black shadow-lg" : "text-[#8A8A8A] hover:text-[#F7F3EC]"
                    )}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Local Offline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupMode('onchain')}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                      groupMode === 'onchain' ? "bg-[#00C896] text-black shadow-lg" : "text-[#8A8A8A] hover:text-[#F7F3EC]"
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Onchain Celo</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#8A8A8A] px-1 leading-normal">
                  {groupMode === 'local' 
                    ? 'Works instantly offline without a wallet. Perfect for quick local splitting.'
                    : 'Saves transactions to the blockchain. Requires a connected wallet and CELO/cUSD.'
                  }
                </p>
              </div>

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
              disabled={!name.trim() || loading}
              onClick={() => groupMode === 'local' ? handleCreate() : requireConnection(handleCreate)}
              loading={loading}
            >
              {loading ? loadingText : 'Create Group'}
            </Button>
            
            {/* Massive spacer to ensure button clears the BottomNav */}
            <div className="h-[120px] w-full shrink-0" />
          </div>
        ) : null}
      </div>
    </>
  );
}
