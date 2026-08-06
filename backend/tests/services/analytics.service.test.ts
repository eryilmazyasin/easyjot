import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AnalyticsService } from "../../src/services/analytics.service.js";
import { CurrencyService } from "../../src/services/currency.service.js";
import { InMemoryAnalyticsRepository } from "../helpers/inMemoryAnalytics.repository.js";
import { InMemoryExchangeRateRepository } from "../helpers/inMemoryExchangeRate.repository.js";
import { InMemoryExpenseRepository } from "../helpers/inMemoryExpense.repository.js";
import { InMemoryUserRepository } from "../helpers/inMemoryUser.repository.js";
import { StaticCurrencyRateProvider } from "../helpers/staticCurrencyRate.provider.js";

describe("AnalyticsService", () => {
  it("converts monthly TRY spending to the user's base currency", async () => {
    const users = new InMemoryUserRepository();
    const user = await users.create({
      email: "user@example.com",
      passwordHash: "hash",
      baseCurrency: "USD",
    });
    await users.updateBudgetSettings(user.id, { monthlyBudget: "100.00" });
    const expenses = new InMemoryExpenseRepository();
    await expenses.create({
      userId: user.id,
      amount: "2000.00",
      originalAmount: "50.00",
      currency: "USD",
      description: "Hosting",
      transactionDate: new Date("2026-08-05T09:00:00.000Z"),
    });
    const currencyService = new CurrencyService(
      new InMemoryExchangeRateRepository(),
      new StaticCurrencyRateProvider({ USD: 40 }),
    );
    const service = new AnalyticsService(
      new InMemoryAnalyticsRepository(expenses),
      users,
      currencyService,
    );

    const summary = await service.getMonthlySummary(
      user.id,
      new Date("2026-08-06T09:00:00.000Z"),
    );

    assert.equal(summary.totalSpent, 50);
    assert.equal(summary.monthlyBudget, 100);
    assert.equal(summary.remainingBudget, 50);
    assert.equal(summary.budgetUsagePercentage, 50);
    assert.equal(summary.recentExpenses[0]?.amountInBaseCurrency, 50);
  });

  it("limits recent expenses to the latest five records", async () => {
    const users = new InMemoryUserRepository();
    const user = await users.create({
      email: "user@example.com",
      passwordHash: "hash",
      baseCurrency: "TRY",
    });
    const expenses = new InMemoryExpenseRepository();

    for (let index = 0; index < 6; index += 1) {
      await expenses.create({
        userId: user.id,
        amount: "100.00",
        originalAmount: "100.00",
        currency: "TRY",
        description: `Expense ${index + 1}`,
        transactionDate: new Date("2026-08-05T09:00:00.000Z"),
      });
    }

    const service = new AnalyticsService(
      new InMemoryAnalyticsRepository(expenses),
      users,
      new CurrencyService(
        new InMemoryExchangeRateRepository(),
        new StaticCurrencyRateProvider({}),
      ),
    );
    const summary = await service.getMonthlySummary(
      user.id,
      new Date("2026-08-06T09:00:00.000Z"),
    );

    assert.equal(summary.recentExpenses.length, 5);
  });
});
