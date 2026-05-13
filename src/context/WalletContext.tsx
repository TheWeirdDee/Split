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
import { celo } from '@/constants/chains';

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
  publicClient: any;
  walletClient: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const MINIMAL_ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [cUSDBalance, setCUSDBalance] = useState('0.00');
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const publicClient = useMemo(() => createPublicClient({
    chain: celo,
    transport: fallback([
      http('https://forno.celo.org', { timeout: 30_000 }),
      http('https://rpc.ankr.com/celo', { timeout: 30_000 }),
      http('https://celo.drpc.org', { timeout: 30_000 }),
    ], { rank: true }),
    batch: { multicall: true },
    pollingInterval: 30_000,
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
    try {
      if (force) {
        localStorage.removeItem('manualDisconnect');
        // Always request permissions to force a wallet popup/account selection
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Switch to Celo Mainnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xA4EC' }]
        });
      } catch (e: any) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });
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
      if (!accounts?.[0]) return;
      const addr = accounts[0];
      const { createWalletClient, custom } = await import('viem');
      const { celo } = await import('viem/chains');
      const client = createWalletClient({
        chain: celo, transport: custom(window.ethereum)
      });
      setAddress(addr);
      setWalletClient(client);
      setIsMiniPay(window.ethereum?.isMiniPay === true);
      await refreshBalance();
    } catch (e: any) {
      if (force && e.code !== 4001) console.error('Connect error:', e);
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
          await connect(false);
        } else {
          const [addr] = await window.ethereum.request({ method: 'eth_accounts' });
          if (addr) {
            await connect(false);
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
      publicClient,
      walletClient,
      connect,
      disconnect,
      refreshBalance
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
