import { createPublicClient, createWalletClient, custom, http, fallback } from 'viem';
import { celo } from 'viem/chains';

// Read-only client for Celo. Uses a fallback transport so a single failing RPC
// endpoint automatically rolls over to the next instead of breaking reads.
export const publicClient = createPublicClient({
  chain: celo,
  transport: fallback([
    http('https://forno.celo.org'),
    http('https://rpc.ankr.com/celo'),
    http('https://celo.drpc.org'),
  ]),
});

// Returns a write-capable client bound to the injected browser wallet, or null
// when there is no provider (SSR or no wallet installed).
export const getWalletClient = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: celo,
      transport: custom(window.ethereum),
    });
  }
  return null;
};
