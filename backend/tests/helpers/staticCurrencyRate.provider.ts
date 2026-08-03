import { CurrencyRateUnavailableError } from "../../src/services/currency.errors.js";
import type { CurrencyRateProvider } from "../../src/services/currency.service.types.js";

export class StaticCurrencyRateProvider implements CurrencyRateProvider {
  public callCount = 0;

  public constructor(private readonly rates: Readonly<Record<string, number>>) {}

  public async getRateToTry(currencyCode: string): Promise<number> {
    this.callCount += 1;
    const rate = this.rates[currencyCode];

    if (rate === undefined) {
      throw new CurrencyRateUnavailableError(currencyCode);
    }

    return rate;
  }
}
