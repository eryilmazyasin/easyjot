import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { UserService } from "../../src/services/user.service.js";
import { InMemoryUserRepository } from "../helpers/inMemoryUser.repository.js";

describe("UserService", () => {
  it("updates a user's monthly budget and base currency", async () => {
    const users = new InMemoryUserRepository();
    const user = await users.create({
      email: "user@example.com",
      passwordHash: "hash",
      baseCurrency: "TRY",
    });
    const service = new UserService(users);

    const budget = await service.updateBudgetSettings(user.id, {
      baseCurrency: "USD",
      monthlyBudget: 500,
    });

    assert.deepEqual(budget, {
      baseCurrency: "USD",
      monthlyBudget: 500,
    });
  });
});
