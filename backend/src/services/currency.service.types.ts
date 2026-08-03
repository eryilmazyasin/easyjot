export interface CurrencyConversion {
  amountInTry: number;
  currency: string;
  originalAmount: number;
  rateToTry: number;
}

export interface CurrencyRateProvider {
  getRateToTry(currencyCode: string): Promise<number>;
}

export type HttpFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;
