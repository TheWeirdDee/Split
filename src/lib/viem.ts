import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { celo } from '@/constants/chains';

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

export const getWalletClient = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: celo,
      transport: custom(window.ethereum),
    });
  }
  return null;
};
