'use client';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useGroups } from '@/hooks/useGroups';
import { useUserBalance } from '@/hooks/useUserBalance';
import { BalanceSummaryCard } from '@/components/app/BalanceSummaryCard';
import { GroupCard } from '@/components/app/GroupCard';
import { Button } from '@/components/common/Button';
import { Wallet2 } from 'lucide-react';

export default function AppHome() {
  const { isConnected, address, isMiniPay, isInitialLoading, connect } = useWallet();
  const [mounted, setMounted] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL 
    || 'https://split-five-eta.vercel.app/app';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isInitialLoading) {
    return <div style={{ minHeight: '100vh', background: '#0D0D0D' }} />;
  }

  if (!isConnected || !address) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '32px',
      }}>
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative w-16 h-16">
            {/* Shadow/Back Layer */}
            <div className="absolute inset-0 bg-[#005a44] rounded-[25%] translate-x-[12%] translate-y-[12%] opacity-60" />
            {/* Main Green Layer */}
            <div className="absolute inset-0 bg-[#00c896] rounded-[25%] flex flex-col items-center justify-center gap-[10%] overflow-hidden">
              <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
              <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
              <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[140%] h-[10%] bg-white rotate-[-45deg] shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
              </div>
            </div>
          </div>
          <span className="clash-display font-bold text-[32px] tracking-tight text-[#f5f0e8] relative group">
            <span className="relative z-10">split</span>
            <span className="absolute inset-0 text-[#ff0000] mix-blend-screen translate-x-[1.5px] opacity-70 pointer-events-none select-none blur-[0.6px]">split</span>
            <span className="absolute inset-0 text-[#00ffff] mix-blend-screen translate-x-[-1.5px] opacity-70 pointer-events-none select-none blur-[0.6px]">split</span>
          </span>
          <p className="dm-sans text-[15px] color-[#8A8A8A] mt-2 max-w-[280px] leading-[1.5] text-center">
            Split bills. Settle instantly with cUSD on Celo.
          </p>
        </div>

        {/* Connect button — ALWAYS show on desktop */}
        {!isMiniPay && (
          <button
            onClick={connect}
            style={{
              width: '100%', maxWidth: '320px',
              height: '56px',
              background: '#00C896',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px', fontWeight: '600',
              color: '#000',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px',
            }}
          >
            Connect Wallet
          </button>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '12px', width: '100%', maxWidth: '320px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#2C2C2C' }} />
          <span style={{ 
            color: '#4A4A4A', fontSize: '12px',
            fontFamily: 'DM Mono, monospace'
          }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#2C2C2C' }} />
        </div>

        {/* QR Code */}
        <div style={{
          background: '#161616',
          border: '1px solid #2C2C2C',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '16px',
          width: '100%', maxWidth: '320px',
        }}>
          <div style={{
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '12px',
          }}>
            {mounted && (
              <QRCodeSVG 
                value={appUrl}
                size={160}
                level="M"
              />
            )}
          </div>
          <p style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '11px',
            color: '#4A4A4A',
            letterSpacing: '0.1em',
            margin: 0, textAlign: 'center'
          }}>
            SCAN TO OPEN IN MINIPAY
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(appUrl);
              alert('Link copied!');
            }}
            style={{
              background: 'transparent',
              border: '1px solid #2C2C2C',
              borderRadius: '2px',
              padding: '8px 20px',
              color: '#8A8A8A',
              fontFamily: 'DM Mono, monospace',
              fontSize: '11px',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            COPY LINK
          </button>
        </div>
      </div>
    );
  }

  // Connected — show groups list
  return <GroupsList address={address} />;
}

function GroupsList({ address }: { address: string }) {
  const { groups, loading } = useGroups();
  const { totalOwed, totalOwing } = useUserBalance();

  return (
    <div style={{ padding: '0 16px', paddingTop: '0px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <BalanceSummaryCard 
          totalOwed={totalOwed}
          totalOwing={totalOwing}
        />
      </div>

      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between px-1">
          <h2 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px', fontWeight: '600',
            color: '#4A4A4A', letterSpacing: '0.08em',
            textTransform: 'uppercase', margin: 0
          }}>
            Your Groups
          </h2>
        </div>

        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#161616] rounded-2xl animate-pulse border border-[#2C2C2C]" />
            ))
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))
          ) : (
            <div className="text-center py-12 space-y-4 border-2 border-dashed border-[#2C2C2C] rounded-2xl">
              <p className="text-[#8A8A8A] text-sm">No groups yet.</p>
              <Link href="/app/create">
                <Button variant="outline" size="sm">
                  Create your first group
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Link href="/app/create" className="block animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div style={{
          background: 'rgba(0,200,150,0.05)',
          border: '1px dashed #00C896',
          borderRadius: '2px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <span style={{ color: '#00C896', fontSize: '24px', fontWeight: '700' }}>+</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: '700', fontSize: '18px', color: '#00C896' }}>
            Create New Group
          </span>
        </div>
      </Link>
    </div>
  );
}
