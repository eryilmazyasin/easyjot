import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import express, { type Express } from "express";
import request from "supertest";

import { errorHandler } from "../../src/middleware/errorHandler.middleware.js";
import { createAnalyticsRouter } from "../../src/routes/analytics.routes.js";
import { createExpenseRouter } from "../../src/routes/expense.routes.js";
import { createUserRouter } from "../../src/routes/user.routes.js";
import { AnalyticsService } from "../../src/services/analytics.service.js";
import { AuthService } from "../../src/services/auth.service.js";
import { CurrencyService } from "../../src/services/currency.service.js";
import { ExpenseService } from "../../src/services/expense.service.js";
import { TextParserService } from "../../src/services/textParser.service.js";
import { UserService } from "../../src/services/user.service.js";
import { InMemoryAnalyticsRepository } from "../helpers/inMemoryAnalytics.repository.js";
import { InMemoryExchangeRateRepository } from "../helpers/inMemoryExchangeRate.repository.js";
import { InMemoryExpenseRepository } from "../helpers/inMemoryExpense.repository.js";
import { InMemoryRefreshTokenRepository } from "../helpers/inMemoryRefreshToken.repository.js";
import { InMemoryUserRepository } from "../helpers/inMemoryUser.repository.js";
import { StaticCurrencyRateProvider } from "../helpers/staticCurrencyRate.provider.js";

const testJwtSecret = "easyjot-test-jwt-secret-with-at-least-32-characters";

describe("Budget and Analytics API", () => {
  let accessToken: string;
  let app: Express;
  let expenseRepository: InMemoryExpenseRepository;
  let userId: string;

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    const authService = new AuthService(
      users,
      new InMemoryRefreshTokenRepository(),
      testJwtSecret,
      4,
    );
    const registration = await authService.register("user@example.com", "secure-password");
    const currencyService = new CurrencyService(
      new InMemoryExchangeRateRepository(),
      new StaticCurrencyRateProvider({ EUR: 45, GBP: 52, USD: 40 }),
    );
    expenseRepository = new InMemoryExpenseRepository();
    const expenseService = new ExpenseService(
      expenseRepository,
      currencyService,
      new TextParserService(),
    );
    const analyticsService = new AnalyticsService(
      new InMemoryAnalyticsRepository(expenseRepository),
      users,
      currencyService,
    );

    accessToken = registration.accessToken;
    userId = registration.user.id;
    app = express();
    app.use(express.json());
    app.use("/api/v1/user", createUserRouter(new UserService(users), authService));
    app.use("/api/v1/expenses", createExpenseRouter(expenseService, authService));
    app.use("/api/v1/analytics", createAnalyticsRouter(analyticsService, authService));
    app.use(errorHandler);
  });

  it("updates the monthly budget limit", async () => {
    const response = await request(app)
      .put("/api/v1/user/budget")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyBudget: 5_000, baseCurrency: "TRY" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.budget, {
      monthlyBudget: 5_000,
      baseCurrency: "TRY",
    });
  });

  it("calculates this month's spending and reports budget overrun", async () => {
    await request(app)
      .put("/api/v1/user/budget")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ monthlyBudget: 1_000, baseCurrency: "TRY" })
      .expect(200);
    await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Market 600" })
      .expect(201);
    await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Fatura 500" })
      .expect(201);
    const currentDate = new Date();
    await expenseRepository.create({
      userId,
      amount: "900.00",
      originalAmount: "900.00",
      currency: "TRY",
      description: "Previous month",
      transactionDate: new Date(
        Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 15, 9),
      ),
    });

    const response = await request(app)
      .get("/api/v1/analytics/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.totalSpent, 1_100);
    assert.equal(response.body.monthlyBudget, 1_000);
    assert.equal(response.body.remainingBudget, -100);
    assert.equal(response.body.budgetUsagePercentage, 110);
    assert.equal(response.body.recentExpenses.length, 2);
  });

  it("returns null budget metrics when no budget is configured", async () => {
    await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Kahve 100" })
      .expect(201);

    const response = await request(app)
      .get("/api/v1/analytics/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.totalSpent, 100);
    assert.equal(response.body.monthlyBudget, null);
    assert.equal(response.body.remainingBudget, null);
    assert.equal(response.body.budgetUsagePercentage, null);
  });
});
