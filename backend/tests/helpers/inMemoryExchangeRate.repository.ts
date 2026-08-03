import { randomUUID } from "node:crypto";

import type {
  ExchangeRateRecord,
  ExchangeRateRepository,
  UpsertExchangeRateRecord,
} from "../../src/repositories/exchangeRate.repository.types.js";

export class InMemoryExchangeRateRepository implements ExchangeRateRepository {
  private readonly rates = new Map<string, ExchangeRateRecord>();

  public async findByCurrencyCode(currencyCode: string): Promise<ExchangeRateRecord | null> {
    return this.rates.get(currencyCode) ?? null;
  }

  public async upsert(input: UpsertExchangeRateRecord): Promise<ExchangeRateRecord> {
    const existingRate = this.rates.get(input.currencyCode);
    const rate: ExchangeRateRecord = {
      ...input,
      id: existingRate?.id ?? randomUUID(),
    };

    this.rates.set(rate.currencyCode, rate);
    return rate;
  }
}
