import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import express, { type Express } from "express";
import request from "supertest";

import { errorHandler } from "../../src/middleware/errorHandler.middleware.js";
import { createExpenseRouter } from "../../src/routes/expense.routes.js";
import { AuthService } from "../../src/services/auth.service.js";
import { CurrencyService } from "../../src/services/currency.service.js";
import { ExpenseService } from "../../src/services/expense.service.js";
import { TextParserService } from "../../src/services/textParser.service.js";
import { InMemoryExchangeRateRepository } from "../helpers/inMemoryExchangeRate.repository.js";
import { InMemoryExpenseRepository } from "../helpers/inMemoryExpense.repository.js";
import { InMemoryRefreshTokenRepository } from "../helpers/inMemoryRefreshToken.repository.js";
import { InMemoryUserRepository } from "../helpers/inMemoryUser.repository.js";
import { StaticCurrencyRateProvider } from "../helpers/staticCurrencyRate.provider.js";

const testJwtSecret = "easyjot-test-jwt-secret-with-at-least-32-characters";

describe("Expense API", () => {
  let accessToken: string;
  let app: Express;

  beforeEach(async () => {
    const authService = new AuthService(
      new InMemoryUserRepository(),
      new InMemoryRefreshTokenRepository(),
      testJwtSecret,
      4,
    );
    const registration = await authService.register("user@example.com", "secure-password");
    const currencyService = new CurrencyService(
      new InMemoryExchangeRateRepository(),
      new StaticCurrencyRateProvider({ EUR: 45, GBP: 52, USD: 40 }),
    );
    const expenseService = new ExpenseService(
      new InMemoryExpenseRepository(),
      currencyService,
      new TextParserService(),
    );

    accessToken = registration.accessToken;
    app = express();
    app.use(express.json());
    app.use("/api/v1/expenses", createExpenseRouter(expenseService, authService));
    app.use(errorHandler);
  });

  it("quick-adds a foreign-currency expense", async () => {
    const response = await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "AWS $10" });

    assert.equal(response.status, 201);
    assert.equal(response.body.expense.amount, 400);
    assert.equal(response.body.expense.originalAmount, 10);
    assert.equal(response.body.expense.currency, "USD");
  });

  it("lists expenses by date with pagination metadata", async () => {
    await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Bugün taksi 150" })
      .expect(201);
    await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Dün yemek 200" })
      .expect(201);

    const response = await request(app)
      .get("/api/v1/expenses?page=1&limit=1")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].description, "taksi");
    assert.deepEqual(response.body.pagination, {
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it("updates an expense", async () => {
    const created = await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Taksi 150" });

    const response = await request(app)
      .put(`/api/v1/expenses/${created.body.expense.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 200, description: "Havalimanı taksi" });

    assert.equal(response.status, 200);
    assert.equal(response.body.expense.amount, 200);
    assert.equal(response.body.expense.originalAmount, 200);
    assert.equal(response.body.expense.description, "Havalimanı taksi");
  });

  it("deletes an expense", async () => {
    const created = await request(app)
      .post("/api/v1/expenses/quick-add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ input: "Kahve 80" });

    await request(app)
      .delete(`/api/v1/expenses/${created.body.expense.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const listResponse = await request(app)
      .get("/api/v1/expenses")
      .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(listResponse.body.pagination.total, 0);
  });
});
