"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
  fallback,
  formatEther,
  parseAbi
} from 'viem';
import { celo } from 'viem/chains';
import { detectMiniPay } from '@/lib/minipay';

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Wallet/session provider for the app. Detects MiniPay vs. a regular injected
 * wallet, tracks the connected address and cUSD balance, exposes shared viem
 * public/wallet clients, and surfaces `hasNoCelo` so the gas strategy can switch
 * (gasPrice in CELO normally; feeCurrency cUSD for MiniPay). Consume via useWallet.
 */

interface WalletContextType {
  address: `0x${string}` | null;
  isConnected: boolean;
  isMiniPay: boolean;
  isInitialLoading: boolean;
  cUSDBalance: string;
  hasNoCelo: boolean;
  publicClient: any;
  walletClient: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  requireConnection: (onConfirm: () => void) => void;
  /** Prompt a wallet signature and establish an httpOnly server session. */
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Reuse an existing session cookie or sign in if none; returns success. */
  ensureSession: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const MINIMAL_ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [cUSDBalance, setCUSDBalance] = useState('0.00');
  const [hasNoCelo, setHasNoCelo] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [injectedProviders, setInjectedProviders] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAnnounce = (event: any) => {
      const detail = event.detail;
      setInjectedProviders((prev) => {
        if (prev.some((p) => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce as EventListener);
    };
  }, []);

  const pendingActionRef = useRef<(() => void) | null>(null);

  const publicClient = useMemo(() => createPublicClient({
    chain: celo,
    transport: fallback([
      http('https://forno.celo.org'),
      http('https://rpc.ankr.com/celo'),
      http('https://celo.drpc.org'),
    ]),
    batch: { multicall: true },
  }), []);

  const [walletClient, setWalletClient] = useState<any>(null);

  const isRefreshingRef = useRef(false);

  const refreshBalance = useCallback(async () => {
    if (!address || isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      const balance = await publicClient.readContract({
        address: CUSD_ADDRESS,
        abi: MINIMAL_ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setCUSDBalance(formatEther(balance as bigint));

      // Fetch native CELO balance to check for 0 CELO (gas warning)
      const celoBalance = await publicClient.getBalance({ address });
      setHasNoCelo(celoBalance === 0n);
    } catch (err) {
      console.error('Balance fetch error:', err);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [address, publicClient]);

  const connect = useCallback(async (selectedProvider?: any) => {
    const provider = selectedProvider && typeof selectedProvider.request === 'function'
      ? selectedProvider
      : null;
    
    // If no provider is passed, open the modal to select
    if (!provider) {
      if (typeof window === 'undefined' || !window.ethereum) {
        alert('Please install MetaMask or another Celo wallet, or open inside MiniPay.');
        return;
      }
      setIsConnectModalOpen(true);
      return;
    }

    // Detect MiniPay FIRST before any other wallet checks
    const isMP = detectMiniPay(provider);

    try {
      if (!isMP) {
        // Only request permissions popup for non-MiniPay wallets
        localStorage.removeItem('manualDisconnect');
        await provider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      // Switch to Celo Mainnet — skip for MiniPay (always on Celo)
      if (!isMP) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xA4EC' }]
          });
        } catch (e: any) {
          if (e.code === 4902) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xA4EC',
                chainName: 'Celo Mainnet',
                nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
                rpcUrls: ['https://forno.celo.org'],
                blockExplorerUrls: ['https://celoscan.io']
              }]
            });
          }
        }
      }

      if (!accounts?.[0]) return;
      const addr = accounts[0];
      const { createWalletClient, custom } = await import('viem');
      const client = createWalletClient({
        chain: celo,
        transport: custom(provider)
      });
      setAddress(addr);
      setWalletClient(client);
      setIsMiniPay(isMP);
      await refreshBalance();
    } catch (e: any) {
      if (e.code !== 4001) console.error('Connect error:', e);
      throw e;
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setCUSDBalance('0');
    setWalletClient(null);
    setIsMiniPay(false);
    try { fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    try {
      localStorage.clear(); 
      localStorage.setItem('manualDisconnect', 'true');
    } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.replace('/app');
  }, []);

  // Establish an authenticated server session by signing a fresh message.
  // Called on-demand before protected reads/writes (not auto-run, so MiniPay's
  // silent reconnect on each load doesn't spam signature prompts).
  const signIn = useCallback(async (): Promise<boolean> => {
    if (!address || !walletClient) return false;
    try {
      const message = `Sign in to Split\n\nAddress: ${address}\nIssued At: ${new Date().toISOString()}\nNonce: ${Math.random().toString(36).slice(2)}`;
      const signature = await walletClient.signMessage({ account: address as `0x${string}`, message });
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });
      return res.ok;
    } catch (e) {
      console.error('Sign-in failed:', e);
      return false;
    }
  }, [address, walletClient]);

  const signOut = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  }, []);

  // Ensure a session exists, reusing the 7-day cookie when present so we only
  // prompt for a signature when there isn't already a valid session.
  const ensureSession = useCallback(async (): Promise<boolean> => {
    try {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (me?.address) return true;        // valid session cookie already present
      if (!me?.enabled) return false;      // auth not configured server-side → never prompt
    } catch {
      return false;
    }
    return signIn();
  }, [signIn]);

  const sessionTriedRef = useRef(false);
  useEffect(() => {
    if (address && walletClient && !sessionTriedRef.current) {
      sessionTriedRef.current = true;
      ensureSession();
    }
    if (!address) sessionTriedRef.current = false;
  }, [address, walletClient, ensureSession]);

  const requireConnection = useCallback((onConfirm: () => void) => {
    if (address) {
      onConfirm();
    } else {
      pendingActionRef.current = onConfirm;
      setIsConnectModalOpen(true);
    }
  }, [address]);

  const handleModalConnect = async (provider: any) => {
    try {
      await connect(provider);
      setIsConnectModalOpen(false);
      // Wait a tick for address state update to propagate, then execute
      setTimeout(() => {
        if (pendingActionRef.current) {
          pendingActionRef.current();
          pendingActionRef.current = null;
        }
      }, 300);
    } catch (err) {
      console.error('Modal connection failed:', err);
    }
  };

  const handleModalClose = () => {
    setIsConnectModalOpen(false);
    pendingActionRef.current = null;
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const isMP = detectMiniPay(window.ethereum);
        setIsMiniPay(isMP);

        const wasManualDisconnect = localStorage.getItem('manualDisconnect') === 'true';
        if (wasManualDisconnect && !isMP) {
          setIsInitialLoading(false);
          return;
        }

        if (isMP) {
          await connect(window.ethereum).catch(() => {});
        } else {
          const [addr] = await window.ethereum.request({ method: 'eth_accounts' }).catch(() => []);
          if (addr) {
            // Silent restore — wallet already authorized, skip wallet_requestPermissions
            try {
              const { createWalletClient: cwc, custom: cust } = await import('viem');
              const client = cwc({ chain: celo, transport: cust(window.ethereum) });
              setAddress(addr as `0x${string}`);
              setWalletClient(client);
            } catch {}
          }
        }
      }
      setIsInitialLoading(false);
    };
    checkConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (address) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [address, refreshBalance]);

  return (
    <WalletContext.Provider value={{
      address,
      isConnected: !!address,
      isMiniPay,
      isInitialLoading,
      cUSDBalance,
      hasNoCelo,
      publicClient,
      walletClient,
      connect,
      disconnect,
      refreshBalance,
      requireConnection,
      signIn,
      signOut,
      ensureSession
    }}>
      {children}
      {isConnectModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#161616',
            border: '1px solid #2C2C2C',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 200, 150, 0.1)',
              border: '1px solid rgba(0, 200, 150, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: '#00C896',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: '20px', fontWeight: 'bold',
                color: '#f5f0e8', margin: 0
              }}>
                Connect Wallet
              </h3>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px', color: '#8a8a8a',
                lineHeight: 1.5, margin: 0
              }}>
                Please connect your Celo wallet to confirm this action onchain.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', width: '100%' }}>
              {injectedProviders.length > 0 ? (
                injectedProviders.map((providerDetail) => (
                  <button
                    key={providerDetail.info.uuid}
                    onClick={() => handleModalConnect(providerDetail.provider)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      height: '52px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #2C2C2C',
                      borderRadius: '14px',
                      padding: '0 16px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#f5f0e8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 200, 150, 0.08)';
                      e.currentTarget.style.borderColor = '#00C896';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = '#2C2C2C';
                    }}
                  >
                    <img 
                      src={providerDetail.info.icon} 
                      alt={providerDetail.info.name} 
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                    <span style={{ flex: 1 }}>{providerDetail.info.name}</span>
                    <span style={{ fontSize: '10px', color: '#00C896', background: 'rgba(0,200,150,0.1)', padding: '2px 6px', borderRadius: '6px' }}>Ready</span>
                  </button>
                ))
              ) : (
                typeof window !== 'undefined' && window.ethereum && (
                  <button
                    onClick={() => handleModalConnect(window.ethereum)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      height: '52px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #2C2C2C',
                      borderRadius: '14px',
                      padding: '0 16px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#f5f0e8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 200, 150, 0.08)';
                      e.currentTarget.style.borderColor = '#00C896';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = '#2C2C2C';
                    }}
                  >
                    <div style={{
                      width: '24px', height: '24px',
                      borderRadius: '6px',
                      background: '#00C896',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}>
                      W
                    </div>
                    <span>Default Provider</span>
                  </button>
                )
              )}
              
              <button
                onClick={handleModalClose}
                style={{
                  height: '44px',
                  background: 'transparent',
                  border: '1px solid #2C2C2C',
                  borderRadius: '14px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#8a8a8a',
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f5f0e8';
                  e.currentTarget.style.borderColor = '#4A4A4A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8a8a8a';
                  e.currentTarget.style.borderColor = '#2C2C2C';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
