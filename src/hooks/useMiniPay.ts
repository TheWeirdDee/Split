import { useMemo } from 'react';

export type MiniPayLaunchParams = {
  amount: string;
  currency?: string;
  memo?: string;
};

export const useMiniPay = () => {
  const isMiniPayAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any)?.navigator?.userAgent?.includes('MiniPay'));
  }, []);

  const launchMiniPay = async ({ amount, currency = 'cUSD', memo }: MiniPayLaunchParams) => {
    if (typeof window === 'undefined') throw new Error('MiniPay is unavailable in this environment');

    const miniPayUrl = `minipay://pay?amount=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}&memo=${encodeURIComponent(memo || '')}`;
    window.location.href = miniPayUrl;
  };

  return { isMiniPayAvailable, launchMiniPay };
};
