import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import type {
  CreateUserRecord,
  UserRecord,
  UserRepository,
} from "./user.repository.types.js";

const userSelection = {
  id: users.id,
  email: users.email,
  passwordHash: users.password,
  baseCurrency: users.baseCurrency,
  createdAt: users.createdAt,
};

export class DrizzleUserRepository implements UserRepository {
  public async create(input: CreateUserRecord): Promise<UserRecord> {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: input.email,
        password: input.passwordHash,
        baseCurrency: input.baseCurrency,
      })
      .returning(userSelection);

    if (!createdUser) {
      throw new Error("The user could not be created.");
    }

    return createdUser;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await db
      .select(userSelection)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  public async findById(id: string): Promise<UserRecord | null> {
    const [user] = await db
      .select(userSelection)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }
}

export const userRepository = new DrizzleUserRepository();
