import { useState, useEffect } from 'react';

/**
 * Returns the cUSD lending APY shown on the savings screens.
 *
 * NOTE: this is currently a mocked rate (~4.52%) with a simulated network delay.
 * To make it live, query the Moola Market subgraph on Celo for the cUSD reserve
 * `liquidityRate` (see the in-body comment for the GraphQL shape).
 */
export function useMoolaYield() {
  const [apy, setApy] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApy() {
      try {
        // In a production app, you would query the Moola Subgraph for the cUSD reserve APY.
        // The query would look like: { reserves(where: { symbol: "cUSD" }) { liquidityRate } }
        // For now, we simulate the current market rate for cUSD on Celo (~4.5%).
        
        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mocked real-world APY for cUSD on Moola
        setApy(4.52);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch Moola APY', err);
        setError('Failed to fetch APY');
        setLoading(false);
      }
    }

    fetchApy();
  }, []);

  return { apy, loading, error };
}
