"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
  formatEther,
  parseAbi
} from 'viem';
import { celo } from 'viem/chains';

declare global {
  interface Window {
    ethereum?: any;
  }
}

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

  const pendingActionRef = useRef<(() => void) | null>(null);

  const publicClient = useMemo(() => createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org'),
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

  const connect = useCallback(async (force = true) => {
    if (!window.ethereum) {
      if (force) alert('Please install MetaMask to use Split on desktop, or open in MiniPay on mobile');
      return;
    }

    // Detect MiniPay FIRST before any other wallet checks
    const isMP = !!(window.ethereum as any).isMiniPay;

    try {
      if (force && !isMP) {
        // Only request permissions popup for non-MiniPay wallets
        localStorage.removeItem('manualDisconnect');
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Switch to Celo Mainnet — skip for MiniPay (always on Celo)
      if (!isMP) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xA4EC' }]
          });
        } catch (e: any) {
          if (e.code === 4902) {
            await window.ethereum.request({
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
        transport: custom(window.ethereum)
      });
      setAddress(addr);
      setWalletClient(client);
      setIsMiniPay(isMP);
      await refreshBalance();
    } catch (e: any) {
      if (force && e.code !== 4001) console.error('Connect error:', e);
      throw e;
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setCUSDBalance('0');
    setWalletClient(null);
    setIsMiniPay(false);
    try { 
      localStorage.clear(); 
      localStorage.setItem('manualDisconnect', 'true');
    } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.replace('/app');
  }, []);

  const requireConnection = useCallback((onConfirm: () => void) => {
    if (address) {
      onConfirm();
    } else {
      pendingActionRef.current = onConfirm;
      setIsConnectModalOpen(true);
    }
  }, [address]);

  const handleModalConnect = async () => {
    try {
      await connect(true);
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
        const isMP = !!(window.ethereum as any).isMiniPay;
        setIsMiniPay(isMP);

        const wasManualDisconnect = localStorage.getItem('manualDisconnect') === 'true';
        if (wasManualDisconnect && !isMP) {
          setIsInitialLoading(false);
          return;
        }

        if (isMP) {
          await connect(false).catch(() => {});
        } else {
          const [addr] = await window.ethereum.request({ method: 'eth_accounts' });
          if (addr) {
            await connect(false).catch(() => {});
          }
        }
      }
      setIsInitialLoading(false);
    };
    checkConnection();
  }, [connect]);

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
      requireConnection
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleModalClose}
                style={{
                  flex: 1, height: '44px',
                  background: 'transparent',
                  border: '1px solid #2C2C2C',
                  borderRadius: '2px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px', fontWeight: 'bold',
                  color: '#8a8a8a', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleModalConnect}
                style={{
                  flex: 1, height: '44px',
                  background: '#00C896',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px', fontWeight: 'bold',
                  color: '#000', cursor: 'pointer'
                }}
              >
                Connect
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
