import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CurrencyService } from "../../src/services/currency.service.js";
import { ExpenseService } from "../../src/services/expense.service.js";
import { TextParserService } from "../../src/services/textParser.service.js";
import { InMemoryExchangeRateRepository } from "../helpers/inMemoryExchangeRate.repository.js";
import { InMemoryExpenseRepository } from "../helpers/inMemoryExpense.repository.js";
import { StaticCurrencyRateProvider } from "../helpers/staticCurrencyRate.provider.js";

describe("ExpenseService", () => {
  it("parses and converts a foreign-currency quick expense", async () => {
    const currencyService = new CurrencyService(
      new InMemoryExchangeRateRepository(),
      new StaticCurrencyRateProvider({ USD: 40 }),
    );
    const service = new ExpenseService(
      new InMemoryExpenseRepository(),
      currencyService,
      new TextParserService(),
    );

    const expense = await service.quickAdd("user-id", "AWS $10");

    assert.equal(expense.originalAmount, 10);
    assert.equal(expense.amount, 400);
    assert.equal(expense.currency, "USD");
    assert.equal(expense.description, "AWS");
  });
});
