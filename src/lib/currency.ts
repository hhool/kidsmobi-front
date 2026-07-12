import { CurrencyData } from "../types";

function getSafeRate(currencyData: CurrencyData): number {
  const rate = Number(currencyData?.rate);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

export function convertUsdToCurrency(amount: unknown, currencyData: CurrencyData): number | null {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric * getSafeRate(currencyData);
}

export function formatCurrencyFromUsd(
  amount: unknown,
  currencyData: CurrencyData,
  lang: "zh" | "en",
  fractionDigits = 2,
): string {
  const converted = convertUsdToCurrency(amount, currencyData);
  if (converted === null) {
    return lang === "zh" ? "待补充" : "N/A";
  }
  return `${currencyData.symbol}${converted.toFixed(fractionDigits)}`;
}
