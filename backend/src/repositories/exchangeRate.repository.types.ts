export interface ExchangeRateRecord {
  id: string;
  currencyCode: string;
  rateToTry: string;
  updatedAt: Date;
}

export interface UpsertExchangeRateRecord {
  currencyCode: string;
  rateToTry: string;
  updatedAt: Date;
}

export interface ExchangeRateRepository {
  findByCurrencyCode(currencyCode: string): Promise<ExchangeRateRecord | null>;
  upsert(input: UpsertExchangeRateRecord): Promise<ExchangeRateRecord>;
}
