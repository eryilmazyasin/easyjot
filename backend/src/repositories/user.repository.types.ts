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
  createdAt: Date;
}

export interface UserRepository {
  create(input: CreateUserRecord): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}
