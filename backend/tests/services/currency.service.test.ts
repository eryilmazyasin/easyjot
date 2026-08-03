import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CurrencyService } from "../../src/services/currency.service.js";
import { InMemoryExchangeRateRepository } from "../helpers/inMemoryExchangeRate.repository.js";
import { StaticCurrencyRateProvider } from "../helpers/staticCurrencyRate.provider.js";

const referenceDate = new Date("2026-08-03T09:00:00.000Z");

describe("CurrencyService", () => {
  it("returns a fresh rate from the database cache without calling the provider", async () => {
    const rates = new InMemoryExchangeRateRepository();
    const provider = new StaticCurrencyRateProvider({ USD: 42 });
    await rates.upsert({
      currencyCode: "USD",
      rateToTry: "40.00000000",
      updatedAt: new Date(referenceDate.getTime() - 60 * 60 * 1_000),
    });
    const service = new CurrencyService(rates, provider);

    assert.equal(await service.getRateToTry("USD", referenceDate), 40);
    assert.equal(provider.callCount, 0);
  });

  it("refreshes a rate when the database cache is older than 24 hours", async () => {
    const rates = new InMemoryExchangeRateRepository();
    const provider = new StaticCurrencyRateProvider({ USD: 42 });
    await rates.upsert({
      currencyCode: "USD",
      rateToTry: "40.00000000",
      updatedAt: new Date(referenceDate.getTime() - 25 * 60 * 60 * 1_000),
    });
    const service = new CurrencyService(rates, provider);

    assert.equal(await service.getRateToTry("USD", referenceDate), 42);
    assert.equal((await rates.findByCurrencyCode("USD"))?.rateToTry, "42.00000000");
    assert.equal(provider.callCount, 1);
  });

  it("converts a foreign amount to TRY and rounds to two decimals", async () => {
    const service = new CurrencyService(
      new InMemoryExchangeRateRepository(),
      new StaticCurrencyRateProvider({ EUR: 47.123 }),
    );

    const conversion = await service.convertToTry(10.5, "EUR");

    assert.equal(conversion.amountInTry, 494.79);
    assert.equal(conversion.originalAmount, 10.5);
    assert.equal(conversion.currency, "EUR");
  });
});
