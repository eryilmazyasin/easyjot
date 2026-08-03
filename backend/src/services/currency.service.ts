import type { ExchangeRateRepository } from "../repositories/exchangeRate.repository.types.js";
import { CurrencyRateUnavailableError } from "./currency.errors.js";
import type {
  CurrencyConversion,
  CurrencyRateProvider,
} from "./currency.service.types.js";

const cacheLifetimeMilliseconds = 24 * 60 * 60 * 1_000;

const roundCurrency = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

export class CurrencyService {
  public constructor(
    private readonly rates: ExchangeRateRepository,
    private readonly provider: CurrencyRateProvider,
  ) {}

  public async getRateToTry(
    currencyCode: string,
    referenceDate: Date = new Date(),
  ): Promise<number> {
    const normalizedCurrency = currencyCode.toLocaleUpperCase("en-US");

    if (normalizedCurrency === "TRY") {
      return 1;
    }

    const cachedRate = await this.rates.findByCurrencyCode(normalizedCurrency);
    const cachedRateValue = Number(cachedRate?.rateToTry);
    const isFresh =
      cachedRate &&
      Number.isFinite(cachedRateValue) &&
      cachedRateValue > 0 &&
      referenceDate.getTime() - cachedRate.updatedAt.getTime() < cacheLifetimeMilliseconds;

    if (isFresh) {
      return cachedRateValue;
    }

    const rateToTry = await this.provider.getRateToTry(normalizedCurrency);

    if (!Number.isFinite(rateToTry) || rateToTry <= 0) {
      throw new CurrencyRateUnavailableError(normalizedCurrency);
    }

    await this.rates.upsert({
      currencyCode: normalizedCurrency,
      rateToTry: rateToTry.toFixed(8),
      updatedAt: referenceDate,
    });

    return rateToTry;
  }

  public async convertToTry(
    originalAmount: number,
    currencyCode: string,
  ): Promise<CurrencyConversion> {
    const normalizedCurrency = currencyCode.toLocaleUpperCase("en-US");
    const rateToTry = await this.getRateToTry(normalizedCurrency);

    return {
      amountInTry: roundCurrency(originalAmount * rateToTry),
      currency: normalizedCurrency,
      originalAmount,
      rateToTry,
    };
  }
}
