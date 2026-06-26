"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchExchangeRates, ExchangeRates, formatFiat, CurrencyCode, CURRENCIES } from '@/lib/fiat';

interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (code: CurrencyCode) => void;
  rates: ExchangeRates;
  loading: boolean;
  formatAmount: (amountusdm: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/**
 * App-wide display-currency provider. Persists the user's chosen currency to
 * localStorage, loads cached/fresh fiat rates, and exposes `formatAmount` to
 * render usdm values in the selected currency. Consume via {@link useCurrency}.
 */
export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>('usdm');
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1.0, NGN: 1500.0, KES: 130.0, EUR: 0.92 });
  const [loading, setLoading] = useState(true);

  // Load selection and rates on mount
  useEffect(() => {
    const saved = localStorage.getItem('split_currency_pref') as CurrencyCode | null;
    if (saved && CURRENCIES.some(c => c.code === saved)) {
      setSelectedCurrencyState(saved);
    }

    const loadRates = async () => {
      try {
        const freshRates = await fetchExchangeRates();
        setRates(freshRates);
      } catch (err) {
        console.error('Failed to load rates in context:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRates();
  }, []);

  const setSelectedCurrency = (code: CurrencyCode) => {
    setSelectedCurrencyState(code);
    localStorage.setItem('split_currency_pref', code);
  };

  const formatAmount = (amountusdm: number): string => {
    const rate = rates[selectedCurrency as keyof ExchangeRates] || 1.0;
    return formatFiat(amountusdm, rate, selectedCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, rates, loading, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
