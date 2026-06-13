'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { AppHeader } from '@/components/app/AppHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { WalletAvatar } from '@/components/common/WalletAvatar';
import { QRCodeSVG } from 'qrcode.react';
import { truncateAddress } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { CATEGORIES } from '@/constants/categories';
import { 
  Receipt, 
  ArrowLeft, 
  Copy, 
  Check, 
  QrCode, 
  Wallet, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';

interface ExpenseRecord {
  id: string;
  group_id: string;
  description: string;
  category: string;
  total_amount: number;
  paid_by: string;
  created_by: string;
  created_at: string;
  status: string;
  onchain_tx: string | null;
}

interface SplitRecord {
  id: string;
  expense_id: string;
  wallet_address: string;
  amount: number;
  is_payer: boolean;
}

interface ProfileRecord {
  wallet_address: string;
  display_name: string | null;
  avatar_emoji: string | null;
}

interface GroupRecord {
  id: string;
  name: string;
  emoji: string | null;
}

export default function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useWallet();
  const { formatAmount } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);
  const [splits, setSplits] = useState<SplitRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRecord>>({});
  const [group, setGroup] = useState<GroupRecord | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<SplitRecord | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchInvoiceData = async () => {
      setLoading(true);
      try {
        // Fetch expense
        const { data: expenseData, error: expenseErr } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (expenseErr || !expenseData) {
          console.error('Expense not found', expenseErr);
          setLoading(false);
          return;
        }

        const exp = expenseData as ExpenseRecord;
        setExpense(exp);

        // Fetch splits
        const { data: splitsData, error: splitsErr } = await supabase
          .from('expense_splits')
          .select('*')
          .eq('expense_id', id);

        if (splitsErr) throw splitsErr;
        const spts = (splitsData || []) as SplitRecord[];
        setSplits(spts);

        // Fetch group info
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name, emoji')
          .eq('id', exp.group_id)
          .maybeSingle();

        if (groupData) {
          setGroup(groupData as GroupRecord);
        }

        // Fetch profiles
        const uniqueAddresses = Array.from(new Set([
          exp.paid_by.toLowerCase(),
          ...spts.map(s => s.wallet_address.toLowerCase())
        ]));

        if (uniqueAddresses.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('wallet_address, display_name, avatar_emoji')
            .in('wallet_address', uniqueAddresses);

          if (profilesData) {
            const profileMap = (profilesData as ProfileRecord[]).reduce((acc, curr) => {
              acc[curr.wallet_address.toLowerCase()] = curr;
              return acc;
            }, {} as Record<string, ProfileRecord>);
            setProfiles(profileMap);
          }
        }

        // Auto-select the connected user's split if they are in this invoice
        if (connectedAddress) {
          const userSplit = spts.find(s => s.wallet_address.toLowerCase() === connectedAddress.toLowerCase());
          if (userSplit && !userSplit.is_payer) {
            setSelectedSplit(userSplit);
          }
        }
      } catch (err) {
        console.error('Error loading invoice details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id, connectedAddress]);

  const handleCopyUri = (uri: string) => {
    navigator.clipboard.writeText(uri).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getProfileInfo = (walletAddress: string) => {
    const norm = walletAddress.toLowerCase();
    return profiles[norm] || {
      wallet_address: norm,
      display_name: null,
      avatar_emoji: '👤'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#00C896] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8A8A8A] font-medium tracking-wide">Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Info className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center space-y-2 max-w-[280px]">
          <h1 className="clash-display text-xl font-bold text-[#F7F3EC]">Invoice Not Found</h1>
          <p className="text-xs text-[#8A8A8A]">
            The shared link might be broken or the expense record was removed.
          </p>
        </div>
        <Button onClick={() => router.push('/app')} size="sm">
          Go to App
        </Button>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[CATEGORIES.length - 1];
  const payerProfile = getProfileInfo(expense.paid_by);
  const payerName = payerProfile.display_name || truncateAddress(expense.paid_by);

  // Generate standard Celo transfer cUSD payment URI
  // Syntax: celo:0x765DE816845861e75A25fCA122bb6898B8B1282a/transfer?address=[PAYER_ADDRESS]&amount=[SHARE_AMOUNT]
  const payShareAmount = selectedSplit ? Number(selectedSplit.amount) : 0;
  const celoPaymentUri = selectedSplit 
    ? `celo:0x765DE816845861e75A25fCA122bb6898B8B1282a/transfer?address=${expense.paid_by.toLowerCase()}&amount=${payShareAmount}`
    : `celo:0x765DE816845861e75A25fCA122bb6898B8B1282a/transfer?address=${expense.paid_by.toLowerCase()}`;

  return (
    <>
      <AppHeader title="Shared Invoice" showBack />
      
      <div className="px-4 pt-20 pb-24 flex flex-col gap-6 bg-[#0D0D0D] min-h-screen">
        
        {/* --- Back button overlay --- */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1.5 text-xs text-[#8A8A8A] hover:text-[#F7F3EC] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          {expense.onchain_tx && (
            <a 
              href={`https://celoscan.io/tx/${expense.onchain_tx}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#00C896] hover:underline bg-[#00C896]/5 border border-[#00C896]/10 px-2 py-0.5 rounded-full"
            >
              <span>Onchain Verified</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* --- Skeumorphic Receipt Card --- */}
        <div className="relative bg-[#161616] border border-[#2C2C2C] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fade-in">
          {/* Top colored category bar */}
          <div 
            style={{ backgroundColor: categoryInfo.color }}
            className="h-2 w-full"
          />

          {/* Receipt Header */}
          <div className="p-6 pb-4 flex justify-between items-start border-b border-[#2C2C2C] border-dashed relative">
            {/* Skeumorphic paper punch hole decorations */}
            <div className="absolute -left-3 bottom-0 w-6 h-6 bg-[#0D0D0D] border-r border-[#2C2C2C] rounded-full translate-y-1/2" />
            <div className="absolute -right-3 bottom-0 w-6 h-6 bg-[#0D0D0D] border-l border-[#2C2C2C] rounded-full translate-y-1/2" />

            <div className="space-y-1">
              <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold">Shared Expense Receipt</span>
              <h2 className="clash-display font-bold text-xl text-[#F7F3EC] leading-tight">
                {expense.description}
              </h2>
              {group && (
                <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
                  <span className="bg-[#1F1F1F] px-1.5 py-0.5 rounded border border-[#2C2C2C] text-[10px]">
                    {group.emoji || '👥'}
                  </span>
                  <span>{group.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] border border-[#2C2C2C] flex items-center justify-center text-xl shadow-inner">
                {payerProfile.avatar_emoji}
              </div>
              <span className="text-[10px] text-[#8A8A8A] font-bold text-right max-w-[80px] truncate" title={payerName}>
                Paid by {payerName.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Receipt Financial Statement */}
          <div className="p-6 py-6 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#1E1E1E]/20 to-transparent border-b border-[#2C2C2C]/50">
            <span className="text-[10px] text-[#8A8A8A] font-bold tracking-widest uppercase">Total Amount</span>
            <div className="clash-display text-4xl font-extrabold text-[#F7F3EC] tracking-tight font-mono">
              {formatAmount(expense.total_amount)}
            </div>
            <span className="text-[10px] text-[#4A4A4A] font-mono mt-1">
              {new Date(expense.created_at).toLocaleDateString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </span>
          </div>

          {/* Splits list (Interactive selector) */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8A8A8A] font-bold uppercase tracking-wider">Itemized Splits</span>
              <span className="text-[10px] text-[#8A8A8A] italic">Select your name to pay</span>
            </div>

            <div className="space-y-2">
              {splits.map((split) => {
                const isSelected = selectedSplit?.id === split.id;
                const profile = getProfileInfo(split.wallet_address);
                const isUserSplit = connectedAddress && split.wallet_address.toLowerCase() === connectedAddress.toLowerCase();
                const displayName = profile.display_name || truncateAddress(split.wallet_address);

                return (
                  <button
                    key={split.id}
                    onClick={() => {
                      if (split.is_payer) return; // payer doesn't pay themselves
                      setSelectedSplit(isSelected ? null : split);
                    }}
                    disabled={split.is_payer}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      split.is_payer 
                        ? 'bg-[#121212]/30 border-[#2C2C2C]/30 opacity-50 cursor-default' 
                        : isSelected 
                          ? 'bg-[#00C896]/10 border-[#00C896] ring-1 ring-[#00C896]/20 shadow-md shadow-[#00C896]/5' 
                          : 'bg-[#1F1F1F] border-[#2C2C2C] hover:border-[#4A4A4A]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0D0D0D] border border-[#2C2C2C] flex items-center justify-center text-sm relative">
                        {profile.avatar_emoji}
                        {split.is_payer && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#00C896] text-[8px] text-black font-extrabold px-1 rounded-md scale-90">
                            PAYER
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#F7F3EC] truncate flex items-center gap-1.5">
                          {displayName}
                          {isUserSplit && (
                            <span className="text-[9px] font-semibold text-[#00C896] bg-[#00C896]/10 px-1.5 py-0.2 rounded-full border border-[#00C896]/20">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#8A8A8A] font-mono truncate">
                          {truncateAddress(split.wallet_address)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-[#F7F3EC]">
                        {formatAmount(Number(split.amount))}
                      </p>
                      {!split.is_payer && (
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-[#00C896]' : 'text-[#8A8A8A]'}`}>
                          {isSelected ? 'Selected' : 'Tap to pay'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skeumorphic barcode and footer decoration */}
          <div className="px-6 pb-6 pt-2 border-t border-[#2C2C2C]/60 flex flex-col items-center gap-2">
            <div className="flex gap-[2px] h-8 opacity-45 overflow-hidden">
              {/* Simulated barcode */}
              {[1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3].map((width, idx) => (
                <div 
                  key={idx} 
                  style={{ width: `${width}px` }} 
                  className="h-full bg-[#8A8A8A]" 
                />
              ))}
            </div>
            <span className="text-[8px] font-mono text-[#4A4A4A] tracking-wider select-none text-center">
              INVOICE-{expense.id.toUpperCase()}
            </span>
          </div>
        </div>

        {/* --- Interactive Scan & Pay Section (Expands when member selected) --- */}
        {selectedSplit ? (
          <div className="space-y-4 animate-slide-down">
            <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A] px-1">
              <Sparkles className="w-4 h-4 text-[#00C896]" />
              <span>Paying <strong>{getProfileInfo(selectedSplit.wallet_address).display_name || truncateAddress(selectedSplit.wallet_address)}</strong>'s share of <strong>{formatAmount(payShareAmount)}</strong></span>
            </div>

            <Card className="bg-[#161616] border border-[#2C2C2C] p-6 rounded-3xl flex flex-col items-center gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-dim/20 rounded-full blur-xl pointer-events-none" />
              
              {/* QR Code Container */}
              <div className="flex flex-col items-center gap-3">
                <div className="bg-[#FFF] p-4 rounded-3xl shadow-inner border border-[#EAEAEA]">
                  <QRCodeSVG value={celoPaymentUri} size={170} level="M" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-[#F7F3EC] flex items-center justify-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-[#00C896]" />
                    Scan with Valora or MetaMask
                  </p>
                  <p className="text-[10px] text-[#8A8A8A]">
                    Transfer exactly {formatAmount(payShareAmount)} cUSD to the creator
                  </p>
                </div>
              </div>

              {/* Direct payment / copy actions */}
              <div className="w-full space-y-3">
                <div className="flex bg-[#0D0D0D] border border-[#2C2C2C] rounded-2xl p-2.5 items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <span className="text-[9px] text-[#4A4A4A] block font-mono uppercase tracking-wider font-semibold">Payment Link URI</span>
                    <span className="text-xs text-[#8A8A8A] font-mono block truncate select-all">{celoPaymentUri}</span>
                  </div>
                  <button
                    onClick={() => handleCopyUri(celoPaymentUri)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1F1F1F] border border-[#2C2C2C] flex items-center justify-center hover:bg-[#2C2C2C] text-[#8A8A8A] hover:text-[#F7F3EC] transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#00C896]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={celoPaymentUri}
                    className="w-full flex items-center justify-center gap-2 bg-[#1F1F1F] hover:bg-[#2C2C2C] border border-[#2C2C2C] rounded-2xl py-3 text-xs font-bold text-[#F7F3EC] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Wallet
                  </a>
                  
                  <button
                    onClick={() => {
                      // Redirect to the built-in settlement route
                      router.push(`/app/settle/${expense.paid_by.toLowerCase()}?groupId=${expense.group_id}&amount=${payShareAmount}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#00C896] hover:bg-[#00a87f] rounded-2xl py-3 text-xs font-bold text-black transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    Pay via App
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="p-4 bg-[#161616]/50 border border-[#2C2C2C] border-dashed rounded-2xl text-center space-y-1">
            <p className="text-xs text-[#8A8A8A] font-medium">Select a share from the receipt list to settle</p>
            <p className="text-[10px] text-[#4A4A4A]">Payments are sent directly to the payer's verified address on Celo.</p>
          </div>
        )}

      </div>
    </>
  );
}
