'use client';

import { useEffect, useState } from 'react';
import { detectMiniPay } from '@/lib/minipay';

/**
 * MiniPay detection hook. Returns true when the app is running inside Opera
 * MiniPay (which injects `window.ethereum.isMiniPay`). Used to tailor the flow
 * for MiniPay — auto-connect, usdm gas, and hiding CELO-specific prompts.
 */
export function useMiniPay(): boolean {
  const [isMiniPay, setIsMiniPay] = useState(false);
  useEffect(() => {
    setIsMiniPay(detectMiniPay());
  }, []);
  return isMiniPay;
}
