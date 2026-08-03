export class CurrencyRateUnavailableError extends Error {
  public constructor(currencyCode: string) {
    super(`The exchange rate for ${currencyCode} is unavailable.`);
    this.name = "CurrencyRateUnavailableError";
  }
}
