import type { CurrencyCode } from "./api.types";

export const formatCurrency = (amount: number, currency: CurrencyCode): string =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatExpenseDate = (date: string): string =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
