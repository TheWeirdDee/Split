"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
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
    transport: http(),
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
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      const client = createWalletClient({
        chain: celo,
        transport: custom(window.ethereum),
      });
      setWalletClient(client);

      const [addr] = await client.requestAddresses();
      setAddress(addr);
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xA4EC' }], // 42220 in hex
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xA4EC',
              chainName: 'Celo Mainnet',
              nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
              rpcUrls: ['https://forno.celo.org'],
              blockExplorerUrls: ['https://celoscan.io'],
            }],
          });
        }
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
    setCUSDBalance('0.00');
    localStorage.clear();
    window.location.href = '/app';
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
      const interval = setInterval(refreshBalance, 10000);
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
