import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { exchangeRates } from "../db/schema.js";
import type {
  ExchangeRateRecord,
  ExchangeRateRepository,
  UpsertExchangeRateRecord,
} from "./exchangeRate.repository.types.js";

export class DrizzleExchangeRateRepository implements ExchangeRateRepository {
  public async findByCurrencyCode(currencyCode: string): Promise<ExchangeRateRecord | null> {
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.currencyCode, currencyCode))
      .limit(1);

    return rate ?? null;
  }

  public async upsert(input: UpsertExchangeRateRecord): Promise<ExchangeRateRecord> {
    const [rate] = await db
      .insert(exchangeRates)
      .values(input)
      .onConflictDoUpdate({
        target: exchangeRates.currencyCode,
        set: {
          rateToTry: input.rateToTry,
          updatedAt: input.updatedAt,
        },
      })
      .returning();

    if (!rate) {
      throw new Error("The exchange rate could not be saved.");
    }

    return rate;
  }
}

export const exchangeRateRepository = new DrizzleExchangeRateRepository();
