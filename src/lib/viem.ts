import { createPublicClient, createWalletClient, custom, http, fallback } from 'viem';
import { celo } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: celo,
  transport: fallback([
    http('https://forno.celo.org'),
    http('https://rpc.ankr.com/celo'),
    http('https://celo.drpc.org'),
  ]),
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
