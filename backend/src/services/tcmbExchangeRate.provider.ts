import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

import { CurrencyRateUnavailableError } from "./currency.errors.js";
import type {
  CurrencyRateProvider,
  HttpFetcher,
} from "./currency.service.types.js";

const tcmbEndpoint = "https://www.tcmb.gov.tr/kurlar/today.xml";

const xmlValueSchema = z.union([z.string(), z.number()]);
const currencyEntrySchema = z.object({
  CurrencyCode: z.string().length(3),
  ForexSelling: xmlValueSchema,
  Unit: xmlValueSchema,
});
const tcmbResponseSchema = z.object({
  Tarih_Date: z.object({
    Currency: z.union([currencyEntrySchema, z.array(currencyEntrySchema)]),
  }),
});

export class TcmbExchangeRateProvider implements CurrencyRateProvider {
  private readonly parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
  });

  public constructor(private readonly fetcher: HttpFetcher = fetch) {}

  public async getRateToTry(currencyCode: string): Promise<number> {
    const normalizedCurrency = currencyCode.toLocaleUpperCase("en-US");

    try {
      const response = await this.fetcher(tcmbEndpoint, {
        headers: {
          Accept: "application/xml",
          "User-Agent": "EasyJot/1.0",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new CurrencyRateUnavailableError(normalizedCurrency);
      }

      const parsedXml: unknown = this.parser.parse(await response.text());
      const parsedResponse = tcmbResponseSchema.safeParse(parsedXml);

      if (!parsedResponse.success) {
        throw new CurrencyRateUnavailableError(normalizedCurrency);
      }

      const entries = Array.isArray(parsedResponse.data.Tarih_Date.Currency)
        ? parsedResponse.data.Tarih_Date.Currency
        : [parsedResponse.data.Tarih_Date.Currency];
      const currency = entries.find((entry) => entry.CurrencyCode === normalizedCurrency);
      const sellingRate = Number(currency?.ForexSelling);
      const unit = Number(currency?.Unit);

      if (!currency || !Number.isFinite(sellingRate) || !Number.isFinite(unit) || unit <= 0) {
        throw new CurrencyRateUnavailableError(normalizedCurrency);
      }

      // TCMB may quote currencies in units greater than one; EasyJot stores the price of one unit.
      return sellingRate / unit;
    } catch (error: unknown) {
      if (error instanceof CurrencyRateUnavailableError) {
        throw error;
      }

      throw new CurrencyRateUnavailableError(normalizedCurrency);
    }
  }
}
