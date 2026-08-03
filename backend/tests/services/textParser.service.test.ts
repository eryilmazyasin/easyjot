import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TextParserService } from "../../src/services/textParser.service.js";

const referenceDate = new Date("2026-08-03T09:00:00.000Z");
const parser = new TextParserService();

describe("TextParserService", () => {
  it('parses "Taksi 150" with the default TRY currency', () => {
    const result = parser.parse("Taksi 150", referenceDate);

    assert.equal(result.amount, 150);
    assert.equal(result.currency, "TRY");
    assert.equal(result.description, "Taksi");
    assert.equal(result.transactionDate.toISOString(), referenceDate.toISOString());
  });

  it('parses "Dün akşam yemek 1200 tl" and moves the date back one day', () => {
    const result = parser.parse("Dün akşam yemek 1200 tl", referenceDate);

    assert.equal(result.amount, 1_200);
    assert.equal(result.currency, "TRY");
    assert.equal(result.description, "akşam yemek");
    assert.equal(result.transactionDate.toISOString(), "2026-08-02T09:00:00.000Z");
  });

  it('parses "AWS $10" as USD', () => {
    const result = parser.parse("AWS $10", referenceDate);

    assert.equal(result.amount, 10);
    assert.equal(result.currency, "USD");
    assert.equal(result.description, "AWS");
  });

  it("uses Diğer when the input only contains a number", () => {
    const result = parser.parse("450", referenceDate);

    assert.equal(result.amount, 450);
    assert.equal(result.description, "Diğer");
  });

  it("distinguishes grouped thousands from decimal amounts", () => {
    assert.equal(parser.parse("Market 1.200 TL", referenceDate).amount, 1_200);
    assert.equal(parser.parse("Kahve 45.50", referenceDate).amount, 45.5);
  });

  it("resolves geçen cuma as the previous Friday", () => {
    const result = parser.parse("Geçen cuma market 250", referenceDate);

    assert.equal(result.description, "market");
    assert.equal(result.transactionDate.toISOString(), "2026-07-31T09:00:00.000Z");
  });
});
