export type SupportedCurrency = "TRY" | "USD" | "EUR" | "GBP";

export interface ParsedExpenseInput {
  amount: number;
  currency: SupportedCurrency;
  description: string;
  transactionDate: Date;
}
