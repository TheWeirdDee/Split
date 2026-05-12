"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  const publicClient = createPublicClient({
    chain: celo,
    transport: fallback([
      http('https://forno.celo.org', { timeout: 30_000 }),
      http('https://rpc.ankr.com/celo', { timeout: 30_000 }),
      http('https://celo.drpc.org', { timeout: 30_000 }),
      http('https://1rpc.io/celo', { timeout: 30_000 }),
    ], { rank: true }),
    batch: { multicall: true },
    pollingInterval: 30_000,
  });

  const [walletClient, setWalletClient] = useState<any>(null);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
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
    }
  }, [address, publicClient]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use Split on desktop, or open in MiniPay on mobile');
      return;
    }
    try {
      // First check if we already have accounts
      let accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      // Only request permissions/accounts if we don't have any yet
      if (!accounts || accounts.length === 0) {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
      }
      // Switch to Celo Mainnet
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
      if (e.code !== 4001) console.error('Connect error:', e);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setCUSDBalance('0');
    setWalletClient(null);
    setIsMiniPay(false);
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.replace('/app');
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const isMP = !!(window.ethereum as any).isMiniPay;
        setIsMiniPay(isMP);

          if (isMP) {
            await connect();
          } else {
            const [addr] = await window.ethereum.request({ method: 'eth_accounts' });
            if (addr) {
              await connect();
            }
          }
      }
    };
    checkConnection();
  }, [connect]);

  useEffect(() => {
    if (address) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, refreshBalance]);

  return (
    <WalletContext.Provider value={{
      address,
      isConnected: !!address,
      isMiniPay,
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
