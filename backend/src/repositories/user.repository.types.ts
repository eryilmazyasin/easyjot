export interface CreateUserRecord {
  email: string;
  passwordHash: string;
  baseCurrency: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  baseCurrency: string;
  monthlyBudget: string | null;
  createdAt: Date;
}

export interface UpdateUserBudgetSettingsRecord {
  baseCurrency?: string;
  monthlyBudget?: string | null;
}

export interface UserRepository {
  create(input: CreateUserRecord): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  updateBudgetSettings(
    id: string,
    changes: UpdateUserBudgetSettingsRecord,
  ): Promise<UserRecord | null>;
}
