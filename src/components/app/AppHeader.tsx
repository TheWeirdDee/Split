'use client';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

// Split logo component
function SplitLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Shadow/Back Layer */}
      <div className="absolute inset-0 bg-[#005a44] rounded-[25%] translate-x-[12%] translate-y-[12%] opacity-60" />
      {/* Main Green Layer */}
      <div className="absolute inset-0 bg-[#00c896] rounded-[25%] flex flex-col items-center justify-center gap-[10%] overflow-hidden">
        {/* Receipt Lines */}
        <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
        <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
        <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
        {/* Diagonal Slash */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[140%] h-[10%] bg-white rotate-[-45deg]" />
        </div>
      </div>
    </div>
  );
}

export function AppHeader({ title, showBack }: AppHeaderProps) {
  const { address, cUSDBalance, disconnect, connect } = useWallet();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const unreadLabel = unreadCount > 99 ? '99+' : unreadCount.toString();

  const formattedBalance = (() => {
    const num = parseFloat(cUSDBalance);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  })();
  
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '430px',
      height: '56px',
      background: 'rgba(13,13,13,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #2C2C2C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 100,
      boxSizing: 'border-box',
    }}>
      {/* Left: Logo or Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {showBack ? (
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#F7F3EC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <Link 
            href="/" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', flexShrink: 0
            }}
          >
            <SplitLogo size={28} />
          </Link>
        )}
        
        <span 
          className="clash-display font-bold text-[18px] tracking-tight text-[#f5f0e8] relative group truncate"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
        >
          <span className="relative z-10">{title || 'split'}</span>
          {!title && (
            <>
              <span className="absolute inset-0 text-[#ff0000] mix-blend-screen translate-x-[0.5px] opacity-70 pointer-events-none select-none blur-[0.3px]">split</span>
              <span className="absolute inset-0 text-[#00ffff] mix-blend-screen translate-x-[-0.5px] opacity-70 pointer-events-none select-none blur-[0.3px]">split</span>
            </>
          )}
        </span>
      </div>

      {/* Right: Wallet badge + disconnect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
        {address && (
          <button
            onClick={() => router.push('/app/notifications')}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid #2C2C2C',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#8A8A8A',
              flexShrink: 0,
            }}
            title="Open notifications"
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              background: unreadCount > 0 ? '#FF5C5C' : '#2C2C2C',
              color: unreadCount > 0 ? '#fff' : '#8A8A8A',
              border: '2px solid #0D0D0D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              fontSize: '10px',
              fontWeight: '700',
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1,
            }}>
              {unreadLabel}
            </span>
          </button>
        )}

        {address && (
          <div className="header-wallet-badge" style={{
            background: '#161616',
            border: '1px solid #2C2C2C',
            borderRadius: '2px',
            padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: '6px',
            flexShrink: 1,
            minWidth: 0,
          }}>
            {/* Colored avatar dot */}
            <div style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: '#00C896',
              flexShrink: 0,
            }} />
            <span className="header-wallet-address" style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '11px',
              color: '#F7F3EC',
              whiteSpace: 'nowrap',
            }}>
              {address.slice(0,6)}...{address.slice(-4)}
            </span>
            <span className="header-wallet-balance" style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '11px',
              color: '#00C896',
              borderLeft: '1px solid #2C2C2C',
              paddingLeft: '6px',
              whiteSpace: 'nowrap',
            }}>
              {formattedBalance} cUSD
            </span>
          </div>
        )}

        {/* Connect or Disconnect/logout button */}
        {!address ? (
          <button
            onClick={connect}
            style={{
              background: '#00C896',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              color: '#000',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Connect
          </button>
        ) : (
          <button
            onClick={() => {
              if (window.confirm('Disconnect wallet?')) disconnect();
            }}
            title="Disconnect wallet"
            style={{
              background: 'transparent',
              border: '1px solid #2C2C2C',
              borderRadius: '2px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#8A8A8A',
              flexShrink: 0,
            }}
          >
            {/* Logout icon — door with arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" 
                 fill="none" stroke="currentColor" 
                 strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
