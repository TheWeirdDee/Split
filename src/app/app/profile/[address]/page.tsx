'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/app/AppHeader';
import { Card } from '@/components/common/Card';
import { QRCodeSVG } from 'qrcode.react';
import { truncateAddress } from '@/lib/utils';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  QrCode,
  Wallet,
  Flame,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';

interface ProfileRecord {
  wallet_address: string;
  display_name: string | null;
  avatar_emoji: string | null;
  streak_count: number;
  created_at: string;
}

export default function ProfilePage() {
  const { address } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!address) return;
    
    const fetchProfileData = async () => {
      setLoading(true);
      const targetAddress = (address as string).toLowerCase();
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('wallet_address', targetAddress)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile', error);
        }

        if (data) {
          setProfile(data as ProfileRecord);
        } else {
          // If no profile exists, set fallback values so page still works
          setProfile({
            wallet_address: targetAddress,
            display_name: null,
            avatar_emoji: '👤',
            streak_count: 0,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Unexpected error loading profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [address]);

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address as string).then(() => {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#00C896] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8A8A8A] font-medium tracking-wide">Loading profile...</span>
        </div>
      </div>
    );
  }

  const targetAddress = (address as string).toLowerCase();
  const displayName = profile?.display_name || truncateAddress(targetAddress);
  const avatar = profile?.avatar_emoji || '👤';
  const streak = profile?.streak_count || 0;
  
  // Format dates beautifully
  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'Recently';

  // Generate dynamic payment link for usdm transfers on Celo
  const numericAmount = parseFloat(amount);
  const celoPaymentUri = !isNaN(numericAmount) && numericAmount > 0
    ? `celo:0x765DE816845861e75A25fCA122bb6898B8B1282a/transfer?address=${targetAddress}&amount=${numericAmount}`
    : `celo:0x765DE816845861e75A25fCA122bb6898B8B1282a/transfer?address=${targetAddress}`;

  return (
    <>
      <AppHeader title="Member Profile" showBack />

      <div className="px-4 pt-20 pb-24 flex flex-col gap-6 bg-[#0D0D0D] min-h-screen">
        
        {/* --- Header back button --- */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-1.5 text-xs text-[#8A8A8A] hover:text-[#F7F3EC] transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* --- Profile Banner Card --- */}
        <Card className="bg-[#161616] border border-[#2C2C2C] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center p-6 gap-4 animate-fade-in">
          {/* Decorative background gradient */}
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-[#FF9500]/20 via-[#00C896]/10 to-[#5AC8FA]/20 opacity-40 blur-lg pointer-events-none" />
          
          {/* Avatar frame */}
          <div className="relative mt-2">
            <div className="w-20 h-20 rounded-3xl bg-[#1F1F1F] border-2 border-[#2C2C2C] flex items-center justify-center shadow-2xl relative">
              {avatar === '👤' ? (
                <User className="w-10 h-10 text-[#00C896]" />
              ) : (
                <span className="text-4xl">{avatar}</span>
              )}
            </div>
            {streak > 0 && (
              <div className="absolute -bottom-1.5 -right-1.5 bg-orange-500 text-black rounded-full p-1.5 border-2 border-[#161616] flex items-center justify-center shadow-lg" title="Active check-in streak!">
                <Flame className="w-3.5 h-3.5 fill-black text-black" />
              </div>
            )}
          </div>

          {/* User details */}
          <div className="text-center space-y-1">
            <h2 className="clash-display text-xl font-bold text-[#F7F3EC] flex items-center justify-center gap-2">
              {displayName}
            </h2>
            <p className="text-xs text-[#8A8A8A] font-mono select-all flex items-center justify-center gap-1.5">
              {truncateAddress(targetAddress)}
              <button 
                onClick={handleCopyAddress}
                className="text-[#4A4A4A] hover:text-[#8A8A8A] transition-colors"
                title="Copy address"
              >
                {copiedAddress ? <Check className="w-3 h-3 text-[#00C896]" /> : <Copy className="w-3 h-3" />}
              </button>
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="w-full grid grid-cols-2 gap-3 mt-2 border-t border-[#2C2C2C]/50 pt-4">
            <div className="bg-[#0D0D0D] border border-[#2C2C2C] rounded-2xl p-3 flex flex-col justify-center items-center text-center">
              <span className="text-[9px] text-[#4A4A4A] font-bold uppercase tracking-wider block mb-0.5">CHECK-IN STREAK</span>
              <span className="font-mono text-sm font-bold text-[#00C896] flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {streak} {streak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="bg-[#0D0D0D] border border-[#2C2C2C] rounded-2xl p-3 flex flex-col justify-center items-center text-center">
              <span className="text-[9px] text-[#4A4A4A] font-bold uppercase tracking-wider block mb-0.5">MEMBER SINCE</span>
              <span className="font-mono text-xs font-bold text-[#F7F3EC] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#8A8A8A]" />
                {joinDate}
              </span>
            </div>
          </div>
        </Card>

        {/* --- Interactive Payment Board --- */}
        <Card className="bg-[#161616] border border-[#2C2C2C] p-6 rounded-3xl flex flex-col items-center gap-6 shadow-xl relative overflow-hidden animate-fade-in delay-100">
          <div className="absolute top-0 left-0 w-24 h-24 bg-brand-dim/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full text-center space-y-1">
            <h3 className="clash-display font-bold text-[#F7F3EC] text-base">Direct Payment Board</h3>
            <p className="text-xs text-[#8A8A8A]">Type any amount below to generate a real-time pay QR code</p>
          </div>

          {/* Amount input box */}
          <div className="w-full space-y-1.5">
            <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider ml-1">Send Amount (usdm)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-[#00C896]" />
              </div>
              <input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="any"
                className="w-full bg-[#0D0D0D] border border-[#2C2C2C] rounded-2xl pl-10 pr-16 py-3.5 text-2xl font-bold font-mono text-[#00C896] focus:outline-none focus:border-[#00C896] transition-colors placeholder:text-[#4A4A4A]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A8A8A] font-mono select-none">
                usdm
              </span>
            </div>
          </div>

          {/* Dynamic QR Code */}
          <div className="flex flex-col items-center gap-3 bg-[#0D0D0D] border border-[#2C2C2C] p-6 rounded-3xl w-full shadow-inner">
            <div className="bg-[#FFF] p-4 rounded-3xl border border-[#EAEAEA]">
              <QRCodeSVG value={celoPaymentUri} size={150} level="M" />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-[11px] font-bold text-[#F7F3EC] flex items-center justify-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-[#00C896]" />
                Scan to Pay {displayName}
              </p>
              <p className="text-[10px] text-[#8A8A8A]">
                {amount ? `Send exactly ${amount} usdm` : 'Supports Valora, MetaMask, and Celo mobile wallets'}
              </p>
            </div>
          </div>

          {/* Links and wallet actions */}
          <div className="w-full space-y-3">
            <div className="flex bg-[#0D0D0D] border border-[#2C2C2C] rounded-2xl p-2.5 items-center justify-between">
              <div className="min-w-0 pr-4">
                <span className="text-[9px] text-[#4A4A4A] block font-mono uppercase tracking-wider font-semibold">Celo usdm URI</span>
                <span className="text-xs text-[#8A8A8A] font-mono block truncate select-all">{celoPaymentUri}</span>
              </div>
              <button
                onClick={() => handleCopyLink(celoPaymentUri)}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1F1F1F] border border-[#2C2C2C] flex items-center justify-center hover:bg-[#2C2C2C] text-[#8A8A8A] hover:text-[#F7F3EC] transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#00C896]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <a 
              href={celoPaymentUri}
              className="w-full flex items-center justify-center gap-2 bg-[#1F1F1F] hover:bg-[#2C2C2C] border border-[#2C2C2C] rounded-2xl py-3.5 text-xs font-bold text-[#F7F3EC] transition-colors"
            >
              <Wallet className="w-4 h-4 text-[#00C896]" />
              Open in Native Wallet
            </a>
          </div>
        </Card>

      </div>
    </>
  );
}
