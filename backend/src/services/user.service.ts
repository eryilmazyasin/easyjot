import type {
  UpdateUserBudgetSettingsRecord,
  UserRepository,
} from "../repositories/user.repository.types.js";
import type {
  UpdateBudgetSettingsInput,
  UserBudgetSettings,
} from "./user.service.types.js";

export class UserNotFoundError extends Error {
  public constructor() {
    super("User not found.");
    this.name = "UserNotFoundError";
  }
}

export class UserService {
  public constructor(private readonly users: UserRepository) {}

  public async updateBudgetSettings(
    userId: string,
    input: UpdateBudgetSettingsInput,
  ): Promise<UserBudgetSettings> {
    const changes: UpdateUserBudgetSettingsRecord = {};

    if (input.baseCurrency !== undefined) {
      changes.baseCurrency = input.baseCurrency;
    }

    if (input.monthlyBudget !== undefined) {
      changes.monthlyBudget = input.monthlyBudget === null ? null : input.monthlyBudget.toFixed(2);
    }

    const user = await this.users.updateBudgetSettings(userId, changes);

    if (!user) {
      throw new UserNotFoundError();
    }

    return {
      baseCurrency: user.baseCurrency,
      monthlyBudget: user.monthlyBudget === null ? null : Number(user.monthlyBudget),
    };
  }
}
