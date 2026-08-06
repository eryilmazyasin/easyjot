import { randomUUID } from "node:crypto";

import type {
  CreateUserRecord,
  UpdateUserBudgetSettingsRecord,
  UserRecord,
  UserRepository,
} from "../../src/repositories/user.repository.types.js";

export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, UserRecord>();
  private readonly userIdsByEmail = new Map<string, string>();

  public async create(input: CreateUserRecord): Promise<UserRecord> {
    const user: UserRecord = {
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      baseCurrency: input.baseCurrency,
      monthlyBudget: null,
      createdAt: new Date(),
    };

    this.usersById.set(user.id, user);
    this.userIdsByEmail.set(user.email, user.id);

    return user;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const userId = this.userIdsByEmail.get(email);
    return userId ? (this.usersById.get(userId) ?? null) : null;
  }

  public async findById(id: string): Promise<UserRecord | null> {
    return this.usersById.get(id) ?? null;
  }

  public async updateBudgetSettings(
    id: string,
    changes: UpdateUserBudgetSettingsRecord,
  ): Promise<UserRecord | null> {
    const user = this.usersById.get(id);

    if (!user) {
      return null;
    }

    const updatedUser: UserRecord = {
      ...user,
      ...changes,
    };
    this.usersById.set(id, updatedUser);

    return updatedUser;
  }
}
