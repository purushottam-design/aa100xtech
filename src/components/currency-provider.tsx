"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { BASE_CURRENCY, currencyByCode, type Currency } from "@/data/currencies";
import { getExchangeRates } from "@/lib/rates.functions";

const STORAGE_KEY = "aa100x:display-currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (code: string) => void;
  /** Converts an INR amount into the selected display currency. */
  convert: (inrAmount: number) => number | null;
  /** Rewrites an INR price string (e.g. "₹9,999/mo") into the selected currency. */
  format: (inrPriceText: string) => string;
  isBase: boolean;
  ratesReady: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const baseCurrency = currencyByCode.get(BASE_CURRENCY)!;

function roundNice(value: number) {
  if (value >= 1000) return Math.round(value / 10) * 10;
  if (value >= 10) return Math.round(value);
  return Math.round(value * 100) / 100;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState(BASE_CURRENCY);
  const fetchRates = getExchangeRates;

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && currencyByCode.has(stored)) setCode(stored);
  }, []);

  const { data } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => fetchRates(),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const setCurrency = useCallback((next: string) => {
    if (!currencyByCode.has(next)) return;
    setCode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — selection simply won't persist
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const currency = currencyByCode.get(code) ?? baseCurrency;
    const rate = code === BASE_CURRENCY ? 1 : data?.rates?.[code];
    const isBase = code === BASE_CURRENCY || !rate;

    const convert = (inr: number) => (rate ? inr * rate : null);

    const format = (inrPriceText: string) => {
      if (isBase || !rate) return inrPriceText;
      return inrPriceText.replace(/₹\s?([\d,]+(?:\.\d+)?)/g, (match, digits: string) => {
        const amount = Number(digits.replace(/,/g, ""));
        if (!Number.isFinite(amount)) return match;
        const converted = roundNice(amount * rate);
        const maximumFractionDigits = converted >= 10 ? 0 : 2;
        return `${currency.symbol}${converted.toLocaleString("en-US", { maximumFractionDigits })}`;
      });
    };

    return {
      currency,
      setCurrency,
      convert,
      format,
      isBase,
      ratesReady: Boolean(data?.rates),
    };
  }, [code, data, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

/** Renders an INR price string converted to the visitor's selected display currency. */
export function Price({ value }: { value: string }) {
  const { format } = useCurrency();
  return <>{format(value)}</>;
}
