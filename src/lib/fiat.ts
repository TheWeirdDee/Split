// Exchange rate fetching and caching utility for cUSD to Fiat conversions

export interface ExchangeRates {
  USD: number;
  NGN: number;
  KES: number;
  EUR: number;
}

const DEFAULT_RATES: ExchangeRates = {
  USD: 1.0,
  NGN: 1500.0,
  KES: 130.0,
  EUR: 0.92,
};

const CACHE_KEY = 'split_fiat_rates';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  if (typeof window === 'undefined') return DEFAULT_RATES;

  try {
    // Check local storage cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION_MS) {
        return rates;
      }
    }

    // Fetch fresh rates (cUSD is pegged to USD, so we fetch USD rates)
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    
    const data = await res.json();
    const freshRates: ExchangeRates = {
      USD: 1.0,
      NGN: data.rates.NGN || DEFAULT_RATES.NGN,
      KES: data.rates.KES || DEFAULT_RATES.KES,
      EUR: data.rates.EUR || DEFAULT_RATES.EUR,
    };

    // Cache in local storage
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates: freshRates,
      timestamp: Date.now()
    }));

    return freshRates;
  } catch (error) {
    console.error('Error fetching exchange rates, using defaults:', error);
    return DEFAULT_RATES;
  }
}

export const CURRENCIES = [
  { code: 'cUSD', symbol: 'cUSD', name: 'cUSD' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function formatFiat(amountCusd: number, rate: number, code: string): string {
  if (code === 'cUSD') {
    return `${amountCusd.toFixed(2)} cUSD`;
  }
  const symbol = CURRENCIES.find(c => c.code === code)?.symbol || '';
  const converted = amountCusd * rate;
  
  // Format currency with thousands separators
  const formatted = converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${symbol}${formatted}`;
}
