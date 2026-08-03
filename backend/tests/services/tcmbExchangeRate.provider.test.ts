import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TcmbExchangeRateProvider } from "../../src/services/tcmbExchangeRate.provider.js";
import type { HttpFetcher } from "../../src/services/currency.service.types.js";

const tcmbXml = `<?xml version="1.0" encoding="UTF-8"?>
<Tarih_Date Tarih="03.08.2026">
  <Currency CurrencyCode="USD">
    <Unit>1</Unit>
    <ForexSelling>40.2500</ForexSelling>
  </Currency>
  <Currency CurrencyCode="JPY">
    <Unit>100</Unit>
    <ForexSelling>27.5000</ForexSelling>
  </Currency>
</Tarih_Date>`;

describe("TcmbExchangeRateProvider", () => {
  it("parses ForexSelling and normalizes rates quoted for multiple units", async () => {
    const fetcher: HttpFetcher = async () =>
      new Response(tcmbXml, {
        headers: { "Content-Type": "application/xml" },
        status: 200,
      });
    const provider = new TcmbExchangeRateProvider(fetcher);

    assert.equal(await provider.getRateToTry("USD"), 40.25);
    assert.equal(await provider.getRateToTry("JPY"), 0.275);
  });
});
